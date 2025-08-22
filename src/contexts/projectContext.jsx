import { createContext, useContext, useEffect, useState } from "react";

const ProjectContext = createContext();

export default function ProjectProvider({ children }) {
    const [project, setProject] = useState(null);

    const fetchProject = () => {
        const activeProject = localStorage.getItem("imis-active-project");

        if (activeProject) {
            setProject(JSON.parse(activeProject));
        }
    }

    const saveProject = () => {
        localStorage.setItem("imis-active-project", JSON.stringify(project));
    }

    useEffect(() => {
        fetchProject();
    }, []);

    useEffect(() => {
        saveProject();
    }, [project]);

    return (
        <ProjectContext.Provider
            value={{ project, setProject }}
        >
            {children}
        </ProjectContext.Provider>
    );
}

export const useProject = () => useContext(ProjectContext);
