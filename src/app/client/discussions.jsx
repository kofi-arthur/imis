import styles from "../../styles/components/discussions.module.css";

import { useEffect, useRef, useState } from "react";

import { Avatar, UserAvatarWithStatus } from "../../components/avatarStack";

import { formatDateTime } from "../../utils/conversions";

import SampleUsers from "../../lib/users.json";

import { ErrorComponentMini } from "../../components/error";
import { useAuth } from "../../contexts/authContext";
import { useProject } from "../../contexts/projectContext";
import { fetchUserChatList } from "../../services/api";

const RecentMessage = ({ item, onclick, isActive }) => {
  return (
    <div
      className={styles.recentMessage}
      onClick={() => onclick(item)}
      style={{ background: isActive && "var(--hover-tile)" }}
    >
      <div className={styles.avatar}>
        <UserAvatarWithStatus user={item?.sender} />
      </div>
      <div className={styles.messageDetails}>
        <div className={styles.metaData}>
          <h4>{item?.sender?.displayName}</h4>
          <span>{formatDateTime(item.timeSent)}</span>
        </div>
        <p>{item.message}</p>
      </div>
    </div>
  );
};

const RecipientMessage = ({ item }) => {
  return (
    <div className={styles.recipientMessage}>
      <div className={styles.avatar}>
        <Avatar user={item?.sender} />
      </div>
      <div className={styles.message}>
        <div className={styles.metaData}>
          <h4>{item?.sender.displayName}</h4>
          <span>{item.timeSent}</span>
        </div>
        <div className={styles.messageBody}>
          <p>{item.message}</p>
        </div>
      </div>
    </div>
  );
};

const SenderMessage = ({ item }) => {
  return (
    <div className={styles.senderMessage}>
      <div className={styles.message}>
        <div className={styles.metaData}>
          <h4>You</h4>
          <span>{item.timeSent}</span>
        </div>
        <div className={styles.messageBody}>
          <p>{item.message}</p>
        </div>
      </div>
      <div className={styles.avatar}>
        <Avatar user={item?.sender} />
      </div>
    </div>
  );
};

const NewChat = ({ members, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  const initialError = {
    title: "",
    message: "",
    isActive: false,
  };
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMembers, setFilteredMembers] = useState(null);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const trimmed = searchTerm.trim().toLowerCase();

      if (!trimmed) {
        setFilteredMembers(null);
        setError(null);
        return;
      }

      const results = SampleUsers.filter((user) =>
        user.displayName.toLowerCase().includes(trimmed)
      );

      if (results.length === 0) {
        setError({
          title: "No User Found",
          message: "No results found",
          isActive: true,
        });
        setFilteredMembers([]);
      } else {
        setError(initialError);
        setFilteredMembers(results);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  return (
    <div className={styles.newChatContainer} ref={ref}>
      <h4 className={styles.title}>New Chat</h4>
      <div className={styles.searchBar}>
        <i className="fal fa-search"></i>
        <input
          type="text"
          placeholder="Search"
          onChange={(e) => setSearchTerm(e.target.value)}
          value={searchTerm}
        />
      </div>
      {!error?.isActive ? (
        <section className={styles.membersList}>
          {(filteredMembers ?? members).map((item, index) => (
            <div className={styles.member} key={index}>
              <div className={styles.avatar}>
                <Avatar user={item} />
              </div>
              <div className={styles.metaData}>
                <h4>{item.displayName}</h4>
                <span>{item.jobTitle}</span>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <ErrorComponentMini title={error.title} message={error.message} />
      )}
    </div>
  );
};

export default function ProjectDiscussions() {
  const { project } = useProject();
  const { user } = useAuth();
  // new chat functionality
  const [isStartingNewChat, setIsStartingNewChat] = useState(false);

  // recent message search functionality
  const [search, setSearch] = useState("");

  // new message functionality
  const newMessageRef = useRef(null);
  const [newMessage, setNewMessage] = useState("");

  // chat functionality
  const initialSelectedChat = {
    displayName: "",
    avatar: "",
    onlineStatus: "offline",
  };
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatlist, setChatlist] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    async function fetchChatList(projectId, userId) {
      const res = await fetchUserChatList(projectId, userId);
      setChatlist(res);
    }

    fetchChatList(project.projectId, user.id);
  }, [user, project]);

  function handleCloseChat() {
    setSelectedChat(initialSelectedChat);
  }

  return (
    // <section className={styles.discussionLayout}>
    //   <section className={styles.messagesManagement}>
    //     <div className={styles.discussionHeader}>
    //       <h3>Discussions</h3>
    //       <button
    //         className={styles.createBtn}
    //         onClick={() => setIsStartingNewChat((prev) => !prev)}
    //       >
    //         <i className="fal fa-edit"></i>
    //       </button>
    //     </div>

    //     <div className={styles.searchbarField}>
    //       <i className="fal fa-search"></i>
    //       <input
    //         type="text"
    //         placeholder="Search"
    //         value={search}
    //         onChange={(e) => setSearch(e.target.value)}
    //       />
    //     </div>

    //     <section className={styles.recentMessages}>
    //       <div
    //         className={styles.recentMessage}
    //         style={{
    //           background:
    //             selectedChat?.displayName === "Project Group" && "var(--hover-tile)",
    //         }}
    //         onClick={() =>
    //           setSelectedChat({
    //             chatId: project.projectId,
    //             displayName: "Project Group",
    //             avatar: "",
    //             onlineStatus: null,
    //           })
    //         }
    //       >
    //         <div className={styles.avatar}>
    //           <img src={optramisIcon} alt="" />
    //         </div>

    //         <div className={styles.messageDetails}>
    //           <div className={styles.metaData}>
    //             <h4>Project Group</h4>
    //             <span>{formatDateTime(new Date().toISOString())}</span>
    //           </div>
    //           <p>
    //             {SampleGroupChat[SampleGroupChat.length - 1]?.sender.mail ===
    //               "paul.arthur@wayoeltd.com"
    //               ? "You"
    //               : SampleGroupChat[SampleGroupChat.length - 1]?.sender
    //                 .displayName}
    //             : {SampleGroupChat[SampleGroupChat.length - 1]?.message}
    //           </p>
    //         </div>
    //       </div>

    //       {chatlist.map((messages, idx) => (
    //         messages?.chatId !== project.projectId && <RecentMessage
    //           key={idx}
    //           item={messages}
    //           isActive={selectedChat?.displayName === messages?.sender?.displayName}
    //           onclick={(e) =>
    //             setSelectedChat({
    //               chatId: e.chatId,
    //               displayName: e?.sender?.displayName,
    //               avatar: e?.sender?.avatar,
    //               onlineStatus: "offline",
    //             })
    //           }
    //         />
    //       ))}
    //       <span className={styles.endOfList}>End of list</span>
    //     </section>
    //   </section>

    //   {selectedChat?.chatId ? (
    //     <section className={styles.messagingPanel}>
    //       <div className={styles.messageHeader}>
    //         <div className={styles.recipientInfo}>
    //           {selectedChat?.displayName === "Project Group" ? (
    //             <div className={styles.avatar}>
    //               <img src={optramisIcon} alt="" />
    //             </div>
    //           ) : (
    //             <div className={styles.avatar}>
    //               <UserAvatarWithStatus user={SampleMessages[0]?.sender} />
    //             </div>
    //           )}
    //           <div className={styles.messageDetails}>
    //             <h4>{selectedChat?.displayName}</h4>
    //             {selectedChat?.displayName === "Project Group" ? (
    //               <span>
    //                 53 members,{" "}
    //                 <span className={styles.membersOnline}>2 online</span>
    //               </span>
    //             ) : (
    //               <span>Online</span>
    //             )}
    //           </div>
    //         </div>
    //         <div className={styles.actions}>
    //           <button
    //             onClick={handleCloseChat}
    //             className={styles.closeBtn}
    //             title="Close Chat"
    //           >
    //             <i className="fal fa-times"></i>
    //           </button>
    //         </div>
    //       </div>

    //       <section className={styles.messageBody}>
    //         {SampleGroupChat.map((messages, idx) =>
    //           messages?.sender.mail === "paul.arthur@wayoeltd.com" ? (
    //             <SenderMessage key={idx} item={messages} />
    //           ) : (
    //             <RecipientMessage key={idx} item={messages} />
    //           )
    //         )}
    //       </section>

    //       <section className={styles.messageInput}>
    //         <textarea
    //           ref={newMessageRef}
    //           rows={1}
    //           value={newMessage}
    //           onChange={(e) => setNewMessage(e.target.value)}
    //           placeholder="Your message"
    //         ></textarea>
    //         <button className={styles.sendBtn}>
    //           <i className="fas fa-paper-plane-top"></i>
    //         </button>
    //       </section>
    //     </section>
    //   ) : (
    //     <section className={styles.noSelectedChat}>
    //       <img src={errorIcon} alt="" width={80} />
    //       <p>No chat selected</p>
    //       <span>Select a chat to start a conversation</span>
    //     </section>
    //   )}

    //   {isStartingNewChat && (
    //     <NewChat
    //       members={SampleUsers}
    //       onClose={() => setIsStartingNewChat(false)}
    //     />
    //   )}
    // </section>

    <div className={styles.comingSoonLayout}>
      <h1>Coming Soon</h1>
    </div>
  );
}
