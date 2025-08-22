import { createContext, useContext, useEffect, useState } from "react";

const ChatContext = createContext();

export default function ChatProvider({ children }) {
    const [chat, setChat] = useState(null);

    const fetchProject = () => {
        const activeChat = localStorage.getItem("imis-active-chat");

        if (activeChat) {
            setChat(JSON.parse(activeChat));
        }
    }

    const saveChat = () => {
        localStorage.setItem("imis-active-chat", JSON.stringify(chat));
    }

    useEffect(() => {
        fetchProject();
    }, []);

    useEffect(() => {
        saveChat();
    }, [chat]);

    return (
        <ChatContext.Provider
            value={{ chat, setChat }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export const useChat = () => useContext(ChatContext);
