import { optramisDB } from "../utils/config.js";
import { defError, PROJECT_UPLOADS_DIR } from "../utils/constants.js";
import { logSystem, logProjectActivity } from "../utils/helpers.js";
import PDFDocument from "pdfkit";
import exceljs from "exceljs";

// Export project timeline to PDF
export const exportPTPDF = async (req, res) => {
  const projectId = req.params.projectId;
  const actor = req.user;

  try {
    const tasksQuery = `
      SELECT taskId, title, description, startDate, dueDate, workOrderNo
      FROM tasks
      WHERE projectId = ? AND parentId IS NULL;
    `;
    const [tasks] = await optramisDB.query(tasksQuery, [projectId]);

    if (tasks.length === 0) return res.json({ error: "No tasks found." });

    const subtasksQuery = `
      SELECT taskId, parentId, title, description, startDate, dueDate
      FROM tasks
      WHERE projectId = ? AND parentId IS NOT NULL;
    `;
    const [subtasks] = await optramisDB.query(subtasksQuery, [projectId]);

    const taskMap = {};
    tasks.forEach((task) => (taskMap[task.taskId] = { ...task, subtasks: [] }));
    subtasks.forEach((s) => taskMap[s.parentId]?.subtasks.push(s));

    const doc = new PDFDocument({
      size: "A4",
      margin: { top: 50, bottom: 40, left: 50, right: 50 },
    });

    const misLogo = "../public/icon.png";
    const companyLogo = "../public/wec.png";
    const fonts = ["../src/assets/fonts/Poppins-Regular.ttf"];

    try {
      doc.font(fonts[0]).fontSize(12).fillColor("#000");
    } catch (error) {
      console.error("Font error:", error);
      doc.font("Helvetica");
    }

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const currentDate = () =>
      new Date().toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

    const addFooter = () => {
      doc
        .moveTo(50, pageHeight - 50)
        .lineTo(pageWidth - 50, pageHeight - 50)
        .strokeColor("#bbb")
        .lineWidth(0.5)
        .stroke();

      doc
        .fontSize(8)
        .fillColor("#555")
        .text(
          `${tasks[0].workOrderNo} - ${currentDate()}`,
          50,
          pageHeight - 80,
          {
            width: pageWidth - 100,
            align: "center",
          }
        );
    };

    doc.image(misLogo, pageWidth - 70, 20, { width: 50, height: 50 });
    doc.image(companyLogo, 20, 20, { width: 80, height: 50 });

    doc.moveDown();
    doc
      .fontSize(20)
      .text(`Project Timeline for Work Order: ${tasks[0].workOrderNo}`, {
        align: "center",
      });
    doc.moveDown();

    tasks.forEach((task, index) => {
      doc
        .fontSize(16)
        .text(`Task ${index + 1}: ${task.title}`, { underline: true });
      doc.fontSize(12).text(`Description: ${task.description}`);
      doc.text(`Start Date: ${task.startDate}`);
      doc.text(`Due Date: ${task.dueDate}`);
      doc.moveDown();

      if (taskMap[task.taskId].subtasks.length > 0) {
        doc.fontSize(14).text("Subtasks:");
        taskMap[task.taskId].subtasks.forEach((s) => {
          doc
            .fontSize(12)
            .list([`${s.title} (Start: ${s.startDate}, Due: ${s.dueDate})`]);
        });
      } else {
        doc.fontSize(12).text("No Subtasks", { italic: true });
      }

      doc.moveDown(2);
      if (doc.y > pageHeight - 100) {
        addFooter();
        doc.addPage();
      }
    });

    addFooter();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=project-timeline-${tasks[0].workOrderNo}.pdf`
    );
    doc.pipe(res);
    doc.end();

    logSystem({
      projectId,
      details: `Exported project timeline to PDF.`,
      version: "client",
     actor: actor.id,
      type: "syslog",
    });
  } catch (err) {
    console.error("Error:", err);
    return res
      .status(500)
      .json({
        error: "An error occurred while exporting the project timeline",
      });
  }
};

// Export to Excel
export const exportPTEXCEL = async (req, res) => {
  const projectId = req.params.projectId;
  const actor = req.user;
  try {
    const tasksQuery = `
      SELECT taskId, title, description, status, priority, estimatedTime, assignees, startDate, dueDate
      FROM tasks
      WHERE projectId = ? AND parentId IS NULL;
    `;
    const [tasks] = await optramisDB.query(tasksQuery, [projectId]);
    if (tasks.length === 0) return res.json({ error: "No tasks found." });

    const subtasksQuery = `
      SELECT taskId, parentId, title, description, status, priority, estimatedTime, assignees, startDate, dueDate
      FROM tasks
      WHERE projectId = ? AND parentId IS NOT NULL;
    `;
    const [subtasks] = await optramisDB.query(subtasksQuery, [projectId]);

    const taskMap = {};
    tasks.forEach((task) => (taskMap[task.taskId] = { ...task, subtasks: [] }));
    subtasks.forEach((s) => taskMap[s.parentId]?.subtasks.push(s));

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet(
      `WorkOrder-${tasks[0].workOrderNo}`
    );

    worksheet.columns = [
      { header: "Task ID", key: "taskId", width: 10 },
      { header: "Task Title", key: "taskTitle", width: 30 },
      { header: "Task Description", key: "taskDescription", width: 40 },
      { header: "Task Status", key: "taskStatus", width: 15 },
      { header: "Task Priority", key: "taskPriority", width: 10 },
      { header: "Task Estimated Time", key: "taskEstimatedTime", width: 15 },
      { header: "Task Assignees", key: "taskAssignees", width: 30 },
      { header: "Task Start Date", key: "taskStartDate", width: 15 },
      { header: "Task Due Date", key: "taskDueDate", width: 15 },
      { header: "Subtasks", key: "subtasks", width: 50 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.autoFilter = { from: "A1", to: "J1" };

    tasks.forEach((task) => {
      const subtasksText = taskMap[task.taskId].subtasks
        .map((s) => `• ${s.title} (${s.status})`)
        .join("\n");

      worksheet.addRow({
        taskId: task.taskId,
        taskTitle: task.title,
        taskDescription: task.description,
        taskStatus: task.status,
        taskPriority: task.priority,
        taskEstimatedTime: task.estimatedTime,
        taskAssignees: task.assignees || "N/A",
        taskStartDate: task.startDate,
        taskDueDate: task.dueDate,
        subtasks: subtasksText || "No subtasks",
      });
    });

    worksheet.eachRow((row, i) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      if (i > 1) {
        const status = row.getCell("taskStatus").value;
        const statusCell = row.getCell("taskStatus");
        const dueDateCell = row.getCell("taskDueDate");

        if (status === "Completed") {
          statusCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF00FF00" },
          };
        } else if (status === "In Progress") {
          statusCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFF00" },
          };
        } else if (status === "Todo") {
          statusCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "80808080" },
          };
        }

        const due = new Date(dueDateCell.value);
        if (due && due < new Date()) {
          dueDateCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFCCCC" },
          };
        }
      }
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=project-timeline-${tasks[0].workOrderNo}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

    logSystem({
      projectId,
      details: `Exported project timeline to Excel.`,
     actor: actor.id,
      version: "client",
      type: "syslog",
    });
  } catch (err) {
    console.error("Error:", err);
    return res
      .status(500)
      .json({
        error: "An error occurred while exporting the project timeline",
      });
  }
};

// fetchReportData
export const fetchReportData = async (req, res) => {
  const projectId = req.params.projectId;
  const query = `
    SELECT * FROM projects WHERE projectId = ?;
    SELECT * FROM tasks WHERE projectId = ?;
    SELECT * FROM projectmembers WHERE projectId = ?;
    SELECT * FROM milestones WHERE projectId = ?;
  `;

  try {
    const [results] = await optramisDB.query(query, [
      projectId,
      projectId,
      projectId,
      projectId,
    ]);

    const reportData = {
      project: results[0][0],
      tasks: results[1],
      members: results[2],
      milestones: results[3],
    };

    return res.json(reportData);
  } catch (err) {
    console.error("Error executing query:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
