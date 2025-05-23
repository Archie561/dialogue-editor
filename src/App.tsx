import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

// Типи
interface Response {
  id: string;
  text: string;
}

interface DialogueLine {
  requiredResponseId: string;
  characterName: string;
  characterImage: string;
  text: string;
  responses: Response[];
}

interface Dialogue {
  requiredResponseId: string;
  backgoundMusic: string;
  backgroundImage: string;
  lines: DialogueLine[];
}

// Генератор кольорів
let usedColors = new Set<string>();

function getRandomColor(): string {
  const pastelColors = [
    "#fde2e2", "#d0ebff", "#d3f9d8", "#fff3bf",
    "#e0c3fc", "#c8f2ef", "#fbe0c3", "#fcd5ce",
    "#e0f7fa", "#f1f0ff", "#e6e6fa", "#faf3dd"
  ];
  const availableColors = pastelColors.filter((color) => !usedColors.has(color));
  if (availableColors.length === 0) {
    usedColors.clear();
    return getRandomColor();
  }
  const selected = availableColors[Math.floor(Math.random() * availableColors.length)];
  usedColors.add(selected);
  return selected;
}

export default function App() {
  const [dialogue, setDialogue] = useState<Dialogue>({
    requiredResponseId: "",
    backgoundMusic: "",
    backgroundImage: "",
    lines: [],
  });

  const [responseColors, setResponseColors] = useState<Record<string, string>>({});

  const allResponses = dialogue.lines.flatMap((line) => line.responses);

  const handleAddLine = () => {
    setDialogue((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          requiredResponseId: "",
          characterName: "",
          characterImage: "",
          text: "",
          responses: [],
        },
      ],
    }));
  };

  const handleDeleteLine = (lineIndex: number) => {
    const deletedResponses = dialogue.lines[lineIndex].responses.map(r => r.id);
    setDialogue((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== lineIndex),
    }));
    setResponseColors((prevColors) => {
      const updated = { ...prevColors };
      deletedResponses.forEach(id => delete updated[id]);
      return updated;
    });
  };

  const handleAddResponse = (lineIndex: number) => {
    const newId = uuidv4();
    const newColor = getRandomColor();
    const newResponse: Response = { id: newId, text: "" };

    setDialogue((prev) => {
      const updatedLines = [...prev.lines];
      updatedLines[lineIndex] = {
        ...updatedLines[lineIndex],
        responses: [...updatedLines[lineIndex].responses, newResponse],
      };
      return { ...prev, lines: updatedLines };
    });

    setResponseColors((prev) => ({ ...prev, [newId]: newColor }));
  };

  const handleDeleteResponse = (lineIndex: number, responseIndex: number) => {
    const responseId = dialogue.lines[lineIndex].responses[responseIndex].id;
    setDialogue((prev) => {
      const updatedLines = [...prev.lines];
      updatedLines[lineIndex].responses = updatedLines[lineIndex].responses.filter((_, i) => i !== responseIndex);
      return { ...prev, lines: updatedLines };
    });
    setResponseColors((prev) => {
      const updated = { ...prev };
      delete updated[responseId];
      return updated;
    });
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
  };

  const handleExport = () => {
    const json = JSON.stringify(dialogue, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dialogue.json";
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      const imported = JSON.parse(json) as Dialogue;

      // Скидаємо старі кольори
      const newColors: Record<string, string> = {};
      imported.lines.forEach(line => {
        line.responses.forEach(response => {
          newColors[response.id] = getRandomColor();
        });
      });

      setDialogue(imported);
      setResponseColors(newColors);
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Dialogue Editor</h1>

      <div className="space-y-2">
        <input
          className="border p-2 w-full"
          placeholder="Required Response ID"
          value={dialogue.requiredResponseId}
          onChange={(e) => setDialogue({ ...dialogue, requiredResponseId: e.target.value })}
        />
        <input
          className="border p-2 w-full"
          placeholder="Background Music"
          value={dialogue.backgoundMusic}
          onChange={(e) => setDialogue({ ...dialogue, backgoundMusic: e.target.value })}
        />
        <input
          className="border p-2 w-full"
          placeholder="Background Image"
          value={dialogue.backgroundImage}
          onChange={(e) => setDialogue({ ...dialogue, backgroundImage: e.target.value })}
        />
      </div>

      <div className="space-y-4">
        {dialogue.lines.map((line, lineIndex) => {
          const matchingResponse = allResponses.find(r => r.id === line.requiredResponseId);
          const bgColor = matchingResponse ? responseColors[matchingResponse.id] : "white";

          return (
            <div key={lineIndex} className="p-4 rounded-lg shadow">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold">Line {lineIndex + 1}</h2>
                <button className="text-red-500" onClick={() => handleDeleteLine(lineIndex)}>Delete Line</button>
              </div>

              <input
                style={{ backgroundColor: bgColor }}
                className="border p-2 w-full mb-1"
                placeholder="Required Response ID"
                value={line.requiredResponseId}
                onChange={(e) => {
                  const newLines = [...dialogue.lines];
                  newLines[lineIndex].requiredResponseId = e.target.value;
                  setDialogue({ ...dialogue, lines: newLines });
                }}
              />
              <div className="flex flex-wrap gap-1 text-xs text-gray-500 mb-2">
                {allResponses.map((r) => (
                  <span
                    key={r.id}
                    className="cursor-pointer border px-1 py-0.5 rounded"
                    onClick={() => {
                      const newLines = [...dialogue.lines];
                      newLines[lineIndex].requiredResponseId = r.id;
                      setDialogue({ ...dialogue, lines: newLines });
                    }}
                    style={{ backgroundColor: responseColors[r.id] || "white" }}>
                    {r.text.slice(0, 20)}
                  </span>
                ))}
              </div>

              <input
                className="border p-2 w-full mb-1"
                placeholder="Character Name"
                value={line.characterName}
                onChange={(e) => {
                  const newLines = [...dialogue.lines];
                  newLines[lineIndex].characterName = e.target.value;
                  setDialogue({ ...dialogue, lines: newLines });
                }}
              />
              <input
                className="border p-2 w-full mb-1"
                placeholder="Character Image"
                value={line.characterImage}
                onChange={(e) => {
                  const newLines = [...dialogue.lines];
                  newLines[lineIndex].characterImage = e.target.value;
                  setDialogue({ ...dialogue, lines: newLines });
                }}
              />
              <textarea
                className="border p-2 w-full mb-1"
                placeholder="Text"
                value={line.text}
                onChange={(e) => {
                  const newLines = [...dialogue.lines];
                  newLines[lineIndex].text = e.target.value;
                  setDialogue({ ...dialogue, lines: newLines });
                }}
              />

              <div className="space-y-2 mt-2">
                {line.responses.map((r, responseIndex) => (
                  <div key={r.id} className="p-2 rounded shadow flex items-center justify-between gap-2" style={{ backgroundColor: responseColors[r.id] }}>
                    <div className="flex flex-col w-full">
                      <span
                        className="font-mono text-xs cursor-pointer"
                        title="Click to copy"
                        onClick={() => handleCopyId(r.id)}>
                        {r.id}
                      </span>
                      <input
                        className="border p-2 mt-1"
                        placeholder="Response Text"
                        value={r.text}
                        onChange={(e) => {
                          const newLines = [...dialogue.lines];
                          newLines[lineIndex].responses[responseIndex].text = e.target.value;
                          setDialogue({ ...dialogue, lines: newLines });
                        }}
                      />
                    </div>
                    <button className="text-red-500" onClick={() => handleDeleteResponse(lineIndex, responseIndex)}>X</button>
                  </div>
                ))}
              </div>
              {line.responses.length < 4 && (
                <button className="mt-2 px-4 py-1 border" onClick={() => handleAddResponse(lineIndex)}>
                  Add Response
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-x-2 mt-4">
        <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleAddLine}>Add Line</button>
        <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={handleExport}>Export JSON</button>
        <input className="mt-2" type="file" onChange={handleImport} />
      </div>
    </div>
  );
}
