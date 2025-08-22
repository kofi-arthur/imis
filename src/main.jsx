import "../public/index.css";

import { Toaster } from "sonner";
import { BrowserRouter } from "react-router";
import { createRoot } from "react-dom/client";

import AppRoutes from "./routes/routes";
import AuthProvider from "./contexts/authContext";
import { SocketProvider } from "./contexts/socketContext";
import ProjectProvider from "./contexts/projectContext";
import ChatProvider from "./contexts/chatContext";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <SocketProvider>
        <ProjectProvider>
          <ChatProvider>
            <AppRoutes />
          </ChatProvider>
          <Toaster position="bottom-center" />
        </ProjectProvider>
      </SocketProvider>
    </AuthProvider>
  </BrowserRouter>
);
