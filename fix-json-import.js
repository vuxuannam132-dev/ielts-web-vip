const fs = require('fs');

const oldFunc = `    const handleJsonImport = () => {
        try {
            const parsed = JSON.parse(jsonImportText);
            const content = parsed.content || parsed;
            
            if (parsed.title) setTitle(parsed.title);
            if (parsed.difficulty) setDifficulty(parsed.difficulty);
            
            let detectedSkill = parsed.skill?.toLowerCase();
            if (!detectedSkill) {
                if (content.passages && Array.isArray(content.passages)) detectedSkill = "reading";
                else if (content.parts || content.audioUrl || content.tapescript) detectedSkill = "listening";
                else if (content.writing || content.type === "TASK1" || content.task1Prompt) detectedSkill = "writing";
                else if (content.speaking || content.part1 || content.part2) detectedSkill = "speaking";
                else detectedSkill = "reading";
            }
            
            setSkill(detectedSkill);
            
            if (detectedSkill === "reading" && content.passages) {
                const safePassages = content.passages.map((p: any) => ({
                    ...p,
                    questions: p.questions?.map((q: any) => ({
                        ...q,
                        options: q.options || ["", "", "", ""]
                    })) || []
                }));
                setParts(safePassages);
            }
            if (detectedSkill === "listening") {
                if (content.audioUrl) setAudioUrl(content.audioUrl);
                if (content.parts) {
                    const safeParts = content.parts.map((p: any) => ({
                        ...p,
                        questions: p.questions?.map((q: any) => ({
                            ...q,
                            options: q.options || ["", "", "", ""]
                        })) || []
                    }));
                    setParts(safeParts);
                }
            }
            if (detectedSkill === "writing" && content.writing) setWriting(content.writing);
            if (detectedSkill === "speaking" && content.speaking) setSpeaking(content.speaking);
            
            setShowJsonModal(false);
            setJsonImportText("");
        } catch (e) {
            alert("JSON không hợp lệ! Vui lòng kiểm tra lại cú pháp.");
        }
    };`;

const newFunc = `    const handleJsonImport = () => {
        try {
            const parsed = JSON.parse(jsonImportText);
            let content = parsed;

            if (parsed[skill]) {
                content = parsed[skill];
            } else if (parsed.content) {
                content = parsed.content;
            } else {
                if (parsed.reading) content = parsed.reading;
                else if (parsed.listening) content = parsed.listening;
                else if (parsed.writing) content = parsed.writing;
                else if (parsed.speaking) content = parsed.speaking;
            }
            
            if (content.title) setTitle(content.title);
            if (content.difficulty) setDifficulty(content.difficulty);
            
            let detectedSkill = content.skill?.toLowerCase();
            if (!detectedSkill) {
                if (content.passages && Array.isArray(content.passages)) detectedSkill = "reading";
                else if (content.parts || content.audioUrl || content.tapescript) detectedSkill = "listening";
                else if (content.writing || content.type === "TASK1" || content.task1Prompt) detectedSkill = "writing";
                else if (content.speaking || content.part1 || content.part2) detectedSkill = "speaking";
                else detectedSkill = skill;
            }
            
            setSkill(detectedSkill);
            
            if (detectedSkill === "reading" && content.passages) {
                const safePassages = content.passages.map((p: any) => ({
                    ...p,
                    questions: p.questions?.map((q: any) => ({
                        ...q,
                        options: q.options || ["", "", "", ""]
                    })) || []
                }));
                setParts(safePassages);
            }
            if (detectedSkill === "listening") {
                if (content.audioUrl) setAudioUrl(content.audioUrl);
                if (content.parts) {
                    const safeParts = content.parts.map((p: any) => ({
                        ...p,
                        questions: p.questions?.map((q: any) => ({
                            ...q,
                            options: q.options || ["", "", "", ""]
                        })) || []
                    }));
                    setParts(safeParts);
                }
            }
            if (detectedSkill === "writing" && content.writing) setWriting(content.writing);
            if (detectedSkill === "speaking" && content.speaking) setSpeaking(content.speaking);
            
            setShowJsonModal(false);
            setJsonImportText("");
        } catch (e) {
            alert("JSON không hợp lệ! Vui lòng kiểm tra lại cú pháp.");
        }
    };`;

function replaceInFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    // Normalize newlines
    let normalizedContent = content.replace(/\\r\\n/g, '\\n');
    let normalizedOld = oldFunc.replace(/\\r\\n/g, '\\n');
    
    if (normalizedContent.includes(normalizedOld)) {
        normalizedContent = normalizedContent.replace(normalizedOld, newFunc);
        // Put back CRLF since it's windows
        fs.writeFileSync(filepath, normalizedContent.replace(/\\n/g, '\\r\\n'));
        console.log('Successfully replaced in ' + filepath);
    } else {
        console.log('Could not find exact block in ' + filepath);
    }
}

replaceInFile('src/app/teacher/upload/page.tsx');
replaceInFile('src/app/admin/upload/page.tsx');
