import { EventEmitter } from "events";
import { Server } from "socket.io";
import { corsConfig, imisDB } from "../utils/config.js";
import {
  buildNotificationMessage,
  chunkArray,
  emailNotif,
  generateEmailTemplate,
  getItemInfo,
  getProjectMembers,
  getUserInfo,
  logProjectActivity,
  logSystem,
  notifyUsers,
  saveDiscussionMessage,
  saveNotification,
  savePrivateMessage,
} from "../utils/helpers.js";

let usersInRooms = {};
let activeUsers = {};
let io;

import { v4 as uuidv4 } from "uuid";

export const eventBus = new EventEmitter();

export async function initializeSocketServer(server) {
  io = new Server(server, {
    cors: corsConfig,
  });

  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.id;
    if (!userId || typeof userId !== "string" || userId.length !== 36) {
      socket.disconnect();
      return;
    }
    let connectionUser;

    if (userId !== null && userId !== undefined) {
      const userInfo = await getUserInfo(userId);
      connectionUser = {
        id: userInfo.id,
        displayName: userInfo.displayName,
        mail: userInfo.mail,
        jobTitle: userInfo.jobTitle,
        avatar: userInfo.avatar,
        socketId: socket.id,
      };
    }

    console.log(
      `${connectionUser.displayName} (socketId: ${socket.id}) connected`
    );

    if (!connectionUser.socketId) {
      // console.log(
      //   `User ${connectionUser.displayName} (socketId: ${socket.id}) tried to connect with an undefined id.`
      // );
      socket.disconnect();
      return;
    }
    // Disconnect any previous connection for this mail
    if (activeUsers[connectionUser.id]) {
      // console.log(
      //   `User ${connectionUser.displayName} is already connected. Disconnecting the previous connection.`
      // );
      const previousSocketId = activeUsers[connectionUser.id].socketId;
      io.sockets.sockets.get(previousSocketId)?.disconnect();
    }

    // Store the new connection using the entire connectionUser object
    activeUsers[connectionUser.id] = connectionUser;

    //Socket Server Functions----------------------------------------------

    socket.on("changeStatus", async ({ projectroom, item, type, status }) => {
      try {
        const projectMembers = await getProjectMembers(projectroom);

        if (type === "projects") {
          eventBus.emit("notifyUsers", {
            action: "statusChange",
            recipients: projectMembers[projectroom],
            item: item,
            extra: { type: "Project", status, actor: connectionUser },
          });
          logProjectActivity({
            projectId: projectroom,
            details: `marked Project - ${item.title} as ${status}`,
            actor: connectionUser.id,
            version: "client",
            type: "activity",
          });

          logSystem({
            projectId: projectroom,
            details: `marked Project - ${item.title} as ${status}`,
            actor: connectionUser.id,
            version: "client",
            type: "syslog",
          });
        } else {
          eventBus.emit("notifyUsers", {
            action: "statusChange",
            recipients: projectMembers[projectroom],
            item: item,
            extra: { type: "Task", status, actor: connectionUser },
          });
          logProjectActivity({
            projectId: projectroom,
            details: `marked Task - ${item.title} as ${status}`,
            actor: connectionUser.id,
            version: "client",
            type: "activity",
          });

          logSystem({
            projectId: projectroom,
            details: `marked Task - ${item.title} as ${status}`,
            actor: connectionUser.id,
            version: "client",
            type: "syslog",
          });
        }
      } catch (err) {
        console.error(`Failed to handle changeStatus for ${projectroom}`, err);
      }
    });

    socket.on("changePriority", async ({ projectroom, item, priority }) => {
      try {
        const projectMembers = await getProjectMembers(projectroom);
        eventBus.emit("notifyUsers", {
          action: "priorityChange",
          recipients: projectMembers[projectroom],
          item: item,
          extra: { type: "Task", priority, actor: connectionUser },
        });

        logProjectActivity({
          projectId: projectroom,
          details: `marked Task - ${item.title} with priority ${priority}`,
          actor: connectionUser.id,
          version: "client",
          type: "activity",
        });

        logSystem({
          projectId: projectroom,
          details: `marked Task - ${item.title} with priority ${priority}`,
          actor: connectionUser.id,
          version: "client",
          type: "syslog",
        });
      } catch (err) {
        console.error(
          `Failed to handle changePriority for project ${project.projectName}:`,
          err
        );
      }
    });

    socket.on("add-comment", async ({ projectId, item, comment }) => {
      const commentId = uuidv4();

      try {
        const insertQuery = `INSERT INTO taskcomments (commentId, projectId, taskId, details, createdBy, likedBy) VALUES (?, ?, ?, ?, ?, ?)
    `;
        await imisDB.execute(insertQuery, [
          commentId,
          projectId,
          item.taskId,
          comment,
          connectionUser.id,
          "[]",
        ]);

        const [commentResults] = await imisDB.execute(
          "SELECT * FROM taskcomments WHERE commentId = ?",
          [commentId]
        );

        if (!commentResults || commentResults.length === 0) return;

        const commentData = commentResults[0];

        const actorInfo = await getUserInfo(commentData.createdBy);
        commentData.createdBy = actorInfo;

        io.emit("receive-comment", {
          taskId: item.taskId,
          comment: commentData,
        });

        const [taskResults] = await imisDB.execute(
          "SELECT assignedTo, createdBy FROM tasks WHERE taskId = ?",
          [item.taskId]
        );

        if (!taskResults || taskResults.length === 0) return;

        const taskMembers = taskResults[0];
        const allMemberIds = Array.from(
          new Set([...(taskMembers.assignedTo || []), taskMembers.createdBy])
        );

        const filteredRecipients = allMemberIds.filter(
          (id) => id !== connectionUser.id
        );

        // Split active vs inactive
        const activeMembers = filteredRecipients.filter(
          (id) => activeUsers[id]
        );
        const inactiveMembers = filteredRecipients.filter(
          (id) => !activeUsers[id]
        );

        // Step 1: Notify all members via socket
        activeMembers.forEach((userId) => {
          const socketId = activeUsers[userId].socketId;
          if (socketId) {
            socket.to(socketId).emit("newTaskNotif", {
              title: `New Comment on Task - ${item.title}`,
              roomId: projectId,
              message: `${commentData.createdBy.displayName} : ${commentData.details}`,
            });
          }
        });

        // Step 2: For inactive ones, get info for emailing
        for (const memberId of inactiveMembers) {
          const userInfo = await getUserInfo(memberId);
          if (userInfo && userInfo.email) {
          }
        }

        // notifyUsers("comment", item, filteredRecipients, {
        //   type: "Task",
        //   comment: commentData,
        //   actor: connectionUser,
        // });

        const projectMembers = await getProjectMembers(projectId);

        eventBus.emit("notifyUsers", {
          action: "comment",
          recipients: projectMembers[projectId].filter(
            (user) => user.id !== connectionUser.id
          ),
          item: commentData,
          extra: { type: "Task", actor: connectionUser },
        });

        // Logs
        logProjectActivity({
          projectId,
          details: `commented on Task - ${item.title} with comment - ${comment}`,
          actor: connectionUser.id,
          version: "admin",
          type: "activity",
        });

        logSystem({
          projectId,
          details: `commented on Task - ${item.title} with comment - ${comment}`,
          actor: connectionUser.id,
          version: "admin",
          type: "syslog",
        });
      } catch (err) {
        console.error("Error handling add-comment socket event:", err);
      }
    });

    socket.on("like-comment", async ({ comment, actor }) => {
      let connection;
      try {
        connection = await imisDB.getConnection();

        await connection.beginTransaction();

        // Lock the row to prevent race conditions
        const [results] = await connection.execute(
          `SELECT likedBy FROM taskcomments WHERE commentId = ? FOR UPDATE`,
          [comment.commentId]
        );

        let likedBy = [];
        let isLike = false;

        if (results && results[0]?.likedBy) {
          try {
            likedBy =
              typeof results[0].likedBy === "string"
                ? JSON.parse(results[0].likedBy)
                : results[0].likedBy;
          } catch {
            likedBy = [];
          }
        }

        const index = likedBy.findIndex(
          (u) => u.mail.trim().toLowerCase() === actor.mail.trim().toLowerCase()
        );

        if (index > -1) {
          likedBy.splice(index, 1);
          isLike = false;
        } else {
          likedBy.push(actor);
          isLike = true;
        }

        await connection.execute(
          `UPDATE taskcomments SET likedBy = ? WHERE commentId = ?`,
          [JSON.stringify(likedBy), comment.commentId]
        );

        await connection.commit();

        if (
          isLike &&
          activeUsers[comment.createdBy?.mail] &&
          activeUsers[comment.createdBy.mail].socketId
        ) {
          socket
            .to(activeUsers[comment.createdBy.mail].socketId)
            .emit("commentNotification", {
              title: `Someone Just Liked Your Comment`,
              message: `${actor.displayName} Liked Your Comment - ${comment.details}`,
              roomId: comment.projectId,
            });
        }

        // Broadcast update to all clients
        io.emit("comment-liked", {
          commentId: comment.commentId,
          likedBy,
        });
      } catch (err) {
        console.error("Error in like-comment:", err);
        if (connection) {
          try {
            await connection.rollback();
          } catch (rollbackErr) {
            console.error("Rollback error:", rollbackErr);
          }
        }
      } finally {
        if (connection) {
          connection.release();
        }
      }
    });

    //Notification Event
    if (!eventBus.listenerCount("notifyUsers")) {
      eventBus.on(
        "notifyUsers",
        async ({ action, recipients, item = {}, extra = {} }) => {
          try {
            // Normalize recipients into two arrays:
            // 1. recipientIds (for saving & socket)
            // 2. recipientObjects (for emails if needed)
            const recipientObjects = Array.isArray(recipients)
              ? recipients
              : [recipients];

            const recipientIds = recipientObjects.map((r) =>
              typeof r === "object" ? r.id : r
            );

            if (recipientIds.length === 0) return;

            // 1) Build the notification content
            const { title, details } = await buildNotificationMessage(
              action,
              item,
              extra
            );

            // 2) Save notification in DB (only user IDs)
            const notificationData = {
              title,
              details,
              projectId: item.projectId || null,
              taskId: item.taskId || null,
              recipients: JSON.stringify(
                Array.isArray(recipientIds) ? recipientIds : [recipientIds]
              ),
            };
            if (extra.actor) {
              notificationData.actor = extra.actor.id || extra.actor;
            }

            await saveNotification(notificationData);

            // 3) Determine online/offline
            const onlineIds = [];
            const offlineUsers = [];

            for (const r of recipientObjects) {
              const userId = typeof r === "object" ? r.id : r;
              if (activeUsers[userId]) {
                onlineIds.push(userId);
              } else {
                offlineUsers.push(r);
              }
            }

            // 4) Socket event name
            const socketEventMap = {
              grant: "Alert-User",
              revoke: "Alert-User",
              ownershipChange: "Alert-User",
              changeUserAccess: "Alert-User",
              managerChange: "Alert-User",
              statusChange: "newTaskNotif",
              assignTask: "newTaskNotif",
              unassignTask: "newTaskNotif",
              priorityChange: "newTaskNotif",
              comment: "newMsgNotif",
              default: "notification",
            };
            const eventName = socketEventMap[action] || socketEventMap.default;

            // 5) Emit to online users
            for (const userId of onlineIds) {
              if (userId !== extra.actor?.id) {
                io.to(activeUsers[userId].socketId).emit(eventName, {
                  roomId: item.projectId || item.roomId || item.id,
                  title,
                  message: details,
                });
              }
              return null;
            }

            // 6) Email to offline users (batch of 10)
            if (offlineUsers.length > 0) {
              const batches = await chunkArray(offlineUsers, 10);
              for (const batch of batches) {
                await Promise.all(
                  batch.map(async (user) => {
                    if (!user?.mail) return null;
                    const emailHtml = await generateEmailTemplate({
                      displayName: user.displayName,
                      title,
                      body: details,
                    });
                    return emailNotif({
                      from: `itdevelopers@wayoeltd.com`,
                      to: user.mail,
                      subject: `[Imis] ${title}`,
                      html: emailHtml,
                    });
                  })
                );
                if (batches.length > 1) {
                  await new Promise((resolve) => setTimeout(resolve, 2000)); // delay to avoid throttling
                }
              }
            }
          } catch (err) {
            console.error("Error in notifyUsers event:", err);
          }
        }
      );
    }

    //Discussion Rooms-------------------------------------------------

    socket.on("join-project-page", ({ projectId }) => {
      if (!usersInRooms[projectId]) {
        usersInRooms[projectId] = {
          users: [],
          discussion: [],
          privateChats: {},
        };
      }
      console.log(
        `${connectionUser.displayName} (socketId: ${socket.id}) joined project room ${projectId}`
      );
      const alreadyIn = usersInRooms[projectId].users.some(
        (u) => u.mail === connectionUser.mail
      );
      if (!alreadyIn) {
        usersInRooms[projectId].users.push(connectionUser);
      }
      socket.join(`project_${projectId}`); // Join the room
      io.in(`project_${projectId}`).emit(
        "room-users",
        usersInRooms[projectId].users.map((user) => ({
          mail: user.mail,
          displayName: user.displayName,
        }))
      );
    });

    socket.on("leave-project-page", ({ projectId }) => {
      console.log(
        `${connectionUser.displayName} (socketId: ${socket.id}) left project room ${projectId}`
      );
      if (usersInRooms[projectId] && usersInRooms[projectId].users.length > 0) {
        usersInRooms[projectId].users = usersInRooms[projectId].users.filter(
          (user) => user.socketId !== socket.id
        );

        socket.leave(`project_${projectId}`); // Leave the room

        io.in(`project_${projectId}`).emit(
          "room-users",
          usersInRooms[projectId].users.map((user) => ({
            mail: user.mail,
            displayName: user.displayName,
          }))
        );
      }
    });

    socket.on("join-discussion-room", ({ projectId }) => {
      console.log("Project Id for discussion room", projectId);

      // Ensure room object exists
      if (!usersInRooms[projectId]) {
        usersInRooms[projectId] = {
          users: [],
          discussion: [],
          privateChats: {},
        };
      }

      if (!Array.isArray(usersInRooms[projectId].discussion)) {
        usersInRooms[projectId].discussion = [];
      }

      // Ensure connectionUser is in users array (project page)
      const alreadyInUsers = usersInRooms[projectId].users.some(
        (u) => u.mail === connectionUser.mail
      );
      if (!alreadyInUsers) {
        usersInRooms[projectId].users.push(connectionUser);
      }

      // Add to discussion if not already present
      const alreadyInDiscussion = usersInRooms[projectId].discussion.some(
        (u) => u.mail === connectionUser.mail
      );
      if (!alreadyInDiscussion) {
        usersInRooms[projectId].discussion.push(connectionUser);
        console.log(
          `${connectionUser.displayName} joined discussion room ${projectId}`
        );
      }

      // Join the socket.io room
      socket.join(`discussion_${projectId}`);

      // Emit updated discussion users list
      io.in(`discussion_${projectId}`).emit(
        "room-users",
        usersInRooms[projectId].discussion.map((user) => ({
          mail: user.mail,
          displayName: user.displayName,
        }))
      );

      console.log(
        "Discussion Users:",
        JSON.stringify(usersInRooms[projectId].discussion)
      );
    });

    socket.on("send-discussion-message", async (data) => {
      const { projectId, roomId, workOrderNo, sender, message, timeSent } =
        data;

      try {
        const projectMembers = await getProjectMembers(roomId);

        const isMember = projectMembers[roomId]?.some(
          (memberObj) => memberObj.member.mail === sender.mail
        );

        if (!isMember) {
          console.log(
            `User ${sender.displayName} is not a member of project ${roomId}`
          );
          socket.emit("error", "You are not a member of this project.");
          return;
        }

        data.type = "discussion";

        // Broadcast to project and discussion rooms
        io.to(`project_${projectId}`).emit("receive-latest-message", data);
        socket
          .to(`discussion_${roomId}`)
          .emit("receive-discussion-message", data);

        // Save the message
        const stringifiedSender = JSON.stringify(sender);
        await saveDiscussionMessage(
          roomId,
          message,
          stringifiedSender,
          timeSent
        );

        const projectMembersMails = projectMembers[roomId].map(
          (memberObj) => memberObj.member.mail
        );

        const activeMembersNotInRoom = projectMembersMails.filter(
          (memberMail) => {
            const isActive = activeUsers[memberMail];
            const isInRoom = usersInRooms[roomId]?.discussion?.find(
              (user) => user.mail === memberMail
            );
            const isOnDiscussionsPage = usersInRooms[roomId]?.users?.find(
              (user) => user.mail === memberMail
            );
            return isActive && !isInRoom && !isOnDiscussionsPage;
          }
        );

        activeMembersNotInRoom.forEach((memberMail) => {
          const recipientConnection = activeUsers[memberMail];
          if (recipientConnection) {
            io.to(recipientConnection.socketId).emit("newNotification", {
              title: `Message from ${workOrderNo} Discussion Room.`,
              roomId,
              message: `${sender.displayName}: ${message}`,
            });
          }
        });
      } catch (err) {
        console.error(`Failed to fetch members for project ${roomId}:`, err);
        socket.emit("error", "Failed to verify project membership.");
      }
    });

    socket.on("leave-discussion-room", ({ projectId }) => {
      const roomData = usersInRooms[projectId];
      if (roomData) {
        // Remove user from discussion
        roomData.discussion = roomData.discussion.filter(
          (user) => user.socketId !== socket.id
        );

        console.log(
          `${connectionUser.displayName} left discussion room ${projectId}`
        );

        // Leave the socket.io room
        socket.leave(`discussion_${projectId}`);

        // // Broadcast updated user list
        // io.in(`discussion_${projectId}`).emit(
        //   "room-users",
        //   roomData.discussion.map((user) => ({
        //     mail: user.mail,
        //     displayName: user.displayName,
        //   }))
        // );

        // Clean up: if discussion is empty, delete it
        if (roomData.discussion.length === 0) {
          delete roomData.discussion;
        }

        // Optional full cleanup: delete project entry if everything is empty
        const noUsers = !roomData.users || roomData.users.length === 0;
        const noDiscussion =
          !roomData.discussion || roomData.discussion.length === 0;
        const noPrivateChats =
          !roomData.privateChats ||
          (typeof roomData.privateChats === "object" &&
            Object.keys(roomData.privateChats).length === 0);

        if (noUsers && noDiscussion && noPrivateChats) {
          delete usersInRooms[projectId];
        }
      }
    });

    //Private Rooms--------------------------------------------------
    socket.on("join-private-room", ({ projectId, roomId }) => {
      // Ensure base structure exists
      if (!usersInRooms[projectId]) {
        usersInRooms[projectId] = {
          users: [],
          discussion: [],
          privateChats: {},
        };
      }

      // Ensure general user is in the project-level `users` array
      const alreadyInUsers = usersInRooms[projectId].users.some(
        (u) => u.mail === connectionUser.mail
      );
      if (!alreadyInUsers) {
        usersInRooms[projectId].users.push(connectionUser);
      }

      // Ensure private room array exists
      if (!usersInRooms[projectId].privateChats[roomId]) {
        usersInRooms[projectId].privateChats[roomId] = [];
      }

      // Avoid duplicate entry in the private room
      const alreadyInPrivate = usersInRooms[projectId].privateChats[
        roomId
      ].some((u) => u.mail === connectionUser.mail);
      if (!alreadyInPrivate) {
        usersInRooms[projectId].privateChats[roomId].push(connectionUser);
        console.log(
          `${connectionUser.displayName} (socketId: ${socket.id}) joined private room ${roomId} in project ${projectId}`
        );
      }

      socket.join(roomId); // Join socket.io room

      // Emit updated private chat users to room
      io.in(roomId).emit(
        "room-users",
        usersInRooms[projectId].privateChats[roomId].map((user) => ({
          mail: user.mail,
          displayName: user.displayName,
        }))
      );
    });

    socket.on("send-private-message", async (data) => {
      const {
        projectId,
        roomId,
        sender,
        recipient,
        message,
        timeSent,
        isRead,
      } = data;

      data.type = "private";

      io.to(`project_${projectId}`).emit("receive-latest-message", data);

      socket.to(roomId).emit("receive-private-message", data);
      // Save the private message (for persistence, etc.)
      const stringifiedSender = JSON.stringify(sender);
      const stringifiedRecipient = JSON.stringify(recipient);
      await savePrivateMessage(
        roomId,
        message,
        stringifiedSender,
        stringifiedRecipient,
        timeSent,
        isRead
      );

      // Check if the recipient is not in the private room and not on the discussions page
      const recipientInRoom = usersInRooms[projectId].privateChats[
        roomId
      ]?.some((user) => user.mail === recipient.mail);
      const recipientInDiscussionPage = usersInRooms[projectId].users?.some(
        (user) => user.mail === recipient.mail
      );

      if (
        !recipientInRoom &&
        !recipientInDiscussionPage &&
        activeUsers[recipient.mail]
      ) {
        console.log(
          `Recipient ${recipient.mail} is not in the private chat and not on the discussions page and is active. Sending notification.`
        );
        // const recipientConnection = activeUsers[recipient.mail];
        // io.to(recipientConnection.socketId).emit("newNotification", {
        //   title: `New Private Message`,
        //   roomId: roomId,
        //   message: `${sender.displayName}: ${message}`,
        // });
      }
    });

    socket.on("leave-private-room", ({ projectId, roomId }) => {
      console.log(
        `${connectionUser.displayName} (socketId: ${socket.id}) left private room ${roomId} in project ${projectId}`
      );

      if (
        usersInRooms[projectId] &&
        usersInRooms[projectId].privateChats[roomId]
      ) {
        // Remove user from private room
        usersInRooms[projectId].privateChats[roomId] = usersInRooms[
          projectId
        ].privateChats[roomId].filter((user) => user.socketId !== socket.id);

        // Emit updated room users
        io.in(roomId).emit(
          "room-users",
          usersInRooms[projectId].privateChats[roomId].map((user) => ({
            mail: user.mail,
            displayName: user.displayName,
          }))
        );

        // Leave socket.io room
        socket.leave(roomId);

        // Clean up if no one is left in this private chat room
        if (usersInRooms[projectId].privateChats[roomId].length === 0) {
          delete usersInRooms[projectId].privateChats[roomId];
        }
      }
    });

    socket.on("disconnect", () => {
      if (!connectionUser) return;

      console.log(
        `${connectionUser.displayName} (socketId: ${socket.id}) disconnected`
      );

      // Remove from active users
      delete activeUsers[connectionUser.id];

      for (const projectId in usersInRooms) {
        const project = usersInRooms[projectId];

        // Remove from users
        if (Array.isArray(project.users)) {
          project.users = project.users.filter(
            (user) => user.socketId !== socket.id
          );
        }

        // Remove from discussion
        if (Array.isArray(project.discussion)) {
          // const wasInDiscussion = project.discussion.some(
          //   (user) => user.socketId === socket.id
          // );
          project.discussion = project.discussion.filter(
            (user) => user.socketId !== socket.id
          );

          // // Emit updated discussion users
          // if (wasInDiscussion) {
          //   io.in(`discussion_${projectId}`).emit(
          //     "room-users",
          //     project.discussion.map((user) => ({
          //       mail: user.mail,
          //       displayName: user.displayName,
          //     }))
          //   );
          // }
        }

        // Remove from private chats
        if (project.privateChats) {
          for (const chatId in project.privateChats) {
            // const wasInPrivate = project.privateChats[chatId].some(
            //   (user) => user.socketId === socket.id
            // );

            project.privateChats[chatId] = project.privateChats[chatId].filter(
              (user) => user.socketId !== socket.id
            );

            // // Emit updated private chat users
            // if (wasInPrivate) {
            //   io.in(chatId).emit(
            //     "room-users",
            //     project.privateChats[chatId].map((user) => ({
            //       mail: user.mail,
            //       displayName: user.displayName,
            //     }))
            //   );
            // }

            // Clean up empty private room
            if (project.privateChats[chatId].length === 0) {
              delete project.privateChats[chatId];
            }
          }
        }

        // Clean up empty project
        const noUsers =
          (!project.users || project.users.length === 0) &&
          (!project.discussion || project.discussion.length === 0) &&
          (!project.privateChats ||
            Object.keys(project.privateChats).length === 0);

        if (noUsers) {
          delete usersInRooms[projectId];
        }
      }
    });
  });

  return io;
}

export async function getSocketInstance() {
  if (!io) {
    initializeSocketServer(); // Initialize the socket server if it hasn't been done yet
  }
  return io;
}

export const getActiveUsers = async () => {
  return activeUsers;
};

