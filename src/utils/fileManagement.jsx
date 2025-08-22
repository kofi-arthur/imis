
export function getFileType(filename) {
    const extension = filename.split('.').pop().toLowerCase();

    const types = {
        pdf: "PDF Document",
        doc: "Word Document",
        docx: "Word Document",
        xls: "Excel Spreadsheet",
        xlsx: "Excel Spreadsheet",
        ppt: "PowerPoint Presentation",
        pptx: "PowerPoint Presentation",
        txt: "Text File",
        jpg: "JPEG Image",
        jpeg: "JPEG Image",
        png: "PNG Image",
        gif: "GIF Image",
        bmp: "Bitmap Image",
        svg: "SVG Image",
        zip: "ZIP Archive",
        rar: "RAR Archive",
        dwg: "AutoCAD Drawing",
        dxf: "AutoCAD Drawing",
        mpp: "Microsoft Project File",
        csv: "CSV File",
        mp3: "MP3 Audio",
        mp4: "MP4 Video",
        mov: "QuickTime Video",
        avi: "AVI Video",
        exe: "Executable File",
        html: "HTML Document",
        css: "CSS File",
        js: "JavaScript File",
        json: "JSON File"
    };

    return types[extension] || `${extension.toUpperCase()} File`;
}

export function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();

    const iconMap = {
        pdf: "fal fa-file-pdf",
        doc: "fal fa-file-word",
        docx: "fal fa-file-word",
        xls: "fal fa-file-excel",
        xlsx: "fal fa-file-spreadsheet",
        ppt: "fal fa-file-powerpoint",
        pptx: "fal fa-file-powerpoint",
        txt: "fal fa-file-lines",
        csv: "fal fa-file-csv",
        zip: "fal fa-file-zipper",
        rar: "fal fa-file-zipper",
        jpg: "fal fa-file-image",
        jpeg: "fal fa-file-image",
        png: "fal fa-file-image",
        gif: "fal fa-file-image",
        bmp: "fal fa-file-image",
        svg: "fal fa-file-image",
        mp3: "fal fa-file-audio",
        wav: "fal fa-file-audio",
        mp4: "fal fa-file-video",
        mov: "fal fa-file-video",
        avi: "fal fa-file-video",
        dwg: "fal fa-file-cad", // not standard; fallback below
        dxf: "fal fa-file-cad", // same here
        mpp: "fal fa-file",     // Project files: no specific FA icon
        html: "fal fa-code",
        css: "fal fa-code",
        js: "fal fa-code",
        json: "fal fa-code",
        exe: "fal fa-file-code"
    };

    return iconMap[ext] || "fal fa-file";
}