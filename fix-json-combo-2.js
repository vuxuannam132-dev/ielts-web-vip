const fs = require('fs');

const fixPage = (filepath) => {
    let content = fs.readFileSync(filepath, 'utf8');

    // We will replace the beginning of handleJsonImport up to the JSON parsing.
    const searchString = `    const handleJsonImport = () => {
        try {
            const parsed = JSON.parse(jsonImportText);
            let content = parsed;`;

    const replaceString = `    const handleJsonImport = async () => {
        try {
            const parsed = JSON.parse(jsonImportText);
            
            // AUTO COMBO DETECTION
            if (parsed.reading && parsed.listening && parsed.writing && parsed.speaking) {
                if (window.confirm("Hệ thống phát hiện JSON chứa trọn bộ 4 kỹ năng.\\nBạn có muốn tự động tạo và lưu cả 4 bài tập ngay lập tức không?")) {
                    const baseTitle = title.trim() || parsed.title || "Bộ đề Combo";
                    const baseDiff = difficulty || parsed.difficulty || "Medium";
                    
                    // classId & publishMode only exist in teacher dashboard
                    const pClassId = (typeof publishMode !== 'undefined' && publishMode === "class" && typeof classId !== 'undefined') ? classId : null;
                    
                    try {
                        const skillsToSave = ['reading', 'listening', 'writing', 'speaking'];
                        for (let s of skillsToSave) {
                            let sTitle = baseTitle;
                            if (parsed[s] && parsed[s].title) {
                                sTitle = baseTitle + " - " + s.toUpperCase();
                            }
                            
                            const apiEndpoint = filepath.includes('admin') ? '/api/admin/practice' : '/api/teacher/practice';
                            
                            await fetch(apiEndpoint, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    skill: s,
                                    title: sTitle,
                                    difficulty: parsed[s]?.difficulty || baseDiff,
                                    contentJSON: parsed[s],
                                    classId: pClassId
                                })
                            });
                        }
                        alert("🎉 Đã tạo thành công 4 bài tập riêng biệt!");
                        setShowJsonModal(false);
                        setJsonImportText("");
                        window.location.href = filepath.includes('admin') ? "/admin" : "/teacher?tab=assignments";
                        return;
                    } catch (e) {
                        alert("Có lỗi xảy ra khi lưu tự động.");
                        return;
                    }
                }
            }

            let content = parsed;`;

    let newContent = content.replace(searchString, replaceString.replace(/filepath\.includes\('admin'\)/g, filepath.includes('admin') ? 'true' : 'false'));

    // Also fix the title overwriting issue
    const titleSearch = `            if (content.title) setTitle(content.title);
            if (content.difficulty) setDifficulty(content.difficulty);`;
    
    const titleReplace = `            if (content.title && !title.trim()) setTitle(content.title);
            if (content.difficulty && !title.trim()) setDifficulty(content.difficulty);`; // Wait, this uses !title.trim() for difficulty? It should be !difficulty.trim() probably.
            
    // Let's rewrite the titleReplace logic.
    // If title input is currently empty, we can set it.
    newContent = newContent.replace(
        `            if (content.title) setTitle(content.title);
            if (content.difficulty) setDifficulty(content.difficulty);`,
        `            if (content.title && !title) setTitle(content.title);
            if (content.difficulty && !difficulty) setDifficulty(content.difficulty);`
    );

    fs.writeFileSync(filepath, newContent);
    console.log('Fixed ' + filepath);
};

fixPage('src/app/teacher/upload/page.tsx');
fixPage('src/app/admin/upload/page.tsx');
