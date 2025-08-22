import { createContext, useContext, useEffect, useState } from "react";

import io from "socket.io-client";

import { useAuth } from "./authContext";

import { api } from "../services/api";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();

  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user) {
      const newSocket = io(api, {
        withCredentials: true,
        query: {
          id: user?.id,
        },
      });

      setSocket(newSocket);

      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }
  }, [user]);
  // -------------- Notification --------------
  useEffect(() => {
    if (Notification.permission === "granted") {
      return;
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("Notification permission granted.");
        } else {
          console.log("Notification permission denied.");
        }
      });
    }
  }, [Notification]);

  function renderNotification(title, body, link) {
    if (Notification.permission === "granted") {
      const notification = new Notification(title, {
        body: body,
        icon: "favicon.svg",
      });

      // Add event listeners (optional)
      notification.onclick = () => {
        navigate(link);
      };
    }
  }

  useEffect(() => {
    if (socket && user.mail) {
      socket.on("Alert-User", (notificationData) => {
        renderNotification(
          notificationData.title,
          notificationData.message,
          `/project/${notificationData.roomId}/dashboard`
        );
      });

      socket.on("newMsgNotif", (notificationData) => {
        console.log(notificationData);
        renderNotification(
          notificationData.title,
          notificationData.message,
          `${notificationData.roomId}/discussions`
        );
      });

      socket.on("newTaskNotif", (notificationData) => {
        console.log(notificationData);
        renderNotification(
          notificationData.title,
          notificationData.message,
          `${notificationData.roomId}/tasks`
        );
      });
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
