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
                    const pClassId = publishMode === "class" ? classId : null;
                    
                    try {
                        const skillsToSave = ['reading', 'listening', 'writing', 'speaking'];
                        for (let s of skillsToSave) {
                            // Determine a suitable title: Use baseTitle, maybe append the skill if it doesn't have it
                            let sTitle = baseTitle;
                            if (parsed[s] && parsed[s].title) {
                                // If the JSON provides a specific title, we can use it, but the user explicitly complained about 
                                // the title not being the "combo title". We will stick to baseTitle.
                                // We can append the skill name so they can distinguish them in the dashboard.
                                sTitle = baseTitle + " - " + s.toUpperCase();
                            }
                            
                            // Wait, the API endpoint is different for admin vs teacher.
                            // But we can check the filepath to determine the API endpoint.
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
                        // Optional redirect
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
            if (content.difficulty && !title.trim()) setDifficulty(content.difficulty);`;
            
    newContent = newContent.replace(titleSearch, titleReplace);

    fs.writeFileSync(filepath, newContent);
    console.log('Fixed ' + filepath);
};

fixPage('src/app/teacher/upload/page.tsx');
fixPage('src/app/admin/upload/page.tsx');
