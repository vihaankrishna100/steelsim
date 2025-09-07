"use client";
import { PlayIcon } from "lucide-react";
import React, { useState } from "react";

type Item = {
  id: number;
  name: string;
};

type ActiveItem = Item & {
  x: number;
  y: number;
};

type DraggableItemProps = {
  item: Item | ActiveItem;
  onDragStart: (item: Item) => void;
  style?: React.CSSProperties;
};

function DraggableItem({ item, onDragStart, style }: DraggableItemProps) {
  return (
    <div
      key={item.id}
      draggable
      onDragStart={() => onDragStart(item)}
      className="h-10 my-2 rounded-lg cursor-grab text-white w-40 outline text-center flex flex-col justify-center absolute"
      style={style}
    >
      {item.name}
    </div>
  );
}

export default function Home() {
  const [bankItems] = useState<Item[]>([
    { id: 1, name: "worker" },
    { id: 2, name: "bessemer converter" },
    { id: 3, name: "air blast system" },
    { id: 4, name: "charging machine" },
    { id: 5, name: "slag removal" },
  ]);
  const [activeItems, setActiveItems] = useState<ActiveItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<Item | null>(null);

  const [workers, setWorkers] = useState(1);
  const [hours, setHours] = useState(1);

  const [pigIron, setPigIron] = useState(1);
  const [limestone, setLimestone] = useState(1);
  const [coal, setCoal] = useState(1);
  const [air, setAir] = useState(1);

  const [results, setResults] = useState<any | null>(null);
  const [question, setQuestion] = useState("");
  const [advice, setAdvice] = useState<string | null>(null);

  const handleDragStart = (item: Item) => {
    setDraggedItem(item);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedItem) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const isActive = activeItems.some((i) => i.id === draggedItem.id);
    if (isActive) {
      setActiveItems(
        activeItems.map((i) =>
          i.id === draggedItem.id ? { ...i, x, y } : i
        )
      );
    } else {
      setActiveItems([...activeItems, { ...draggedItem, x, y }]);
    }
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // --- Backend connection ---
  const runSimulation = async () => {
    try {
      const res = await fetch("http://localhost:6969/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workers, hours }),
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Simulation error:", err);
    }
  };

  const askAdvisor = async () => {
    if (!results) return;
    try {
      const res = await fetch("http://localhost:6969/get-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulation_data: results, question }),
      });
      const data = await res.json();
      setAdvice(data.advice || data.error);
    } catch (err) {
      console.error("Advisor error:", err);
    }
  };

  return (
    <div className="flex gap-10 m-6 bg-black text-white min-h-screen">
      {/* Left Sidebar */}
      <div
        onDragOver={handleDragOver}
        className="h-screen w-60 border-r border-white relative p-2"
      >
        <h3 className="mb-2 font-bold">Items</h3>
        {bankItems.map((item) => (
          <DraggableItem
            key={item.id}
            item={item}
            onDragStart={handleDragStart}
            style={{ position: "static", background: "#444" }}
          />
        ))}

        {/* Simulation Controls */}
        <div className="mt-6 space-y-4">
          <label className="block">
            Workers:
            <input
              type="number"
              min="1"
              value={workers}
              onChange={(e) => setWorkers(Number(e.target.value))}
              className="ml-2 text-white px-2 rounded outline-1"
            />
          </label>
          <label className="block">
            Hours:
            <input
              type="number"
              min="1"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="ml-2 text-white px-2 rounded outline-1"
            />
          </label>
          <label className="block">
            Pig Iron:
            <input
              type="number"
              min="1"
              value={pigIron}
              onChange={(e) => setPigIron(Number(e.target.value))}
              className="ml-2 text-white px-2 rounded outline-1"
            />
          </label>
          <label className="block">
            Limestone:
            <input
              type="number"
              min="1"
              value={limestone}
              onChange={(e) => setLimestone(Number(e.target.value))}
              className="ml-2 text-white px-2 rounded outline-1"
            />
          </label>
          <label className="block">
            Coal:
            <input
              type="number"
              min="1"
              value={coal}
              onChange={(e) => setCoal(Number(e.target.value))}
              className="ml-2 text-white px-2 rounded outline-1"
            />
          </label>
          <label className="block">
            Air:
            <input
              type="number"
              min="1"
              value={air}
              onChange={(e) => setAir(Number(e.target.value))}
              className="ml-2 text-white px-2 rounded outline-1"
            />
          </label>
          <button
            onClick={runSimulation}
            className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 w-full flex flex-row gap-x-2"
          >
            <PlayIcon size={20} className="my-auto"/>
            Run Simulation
          </button>
        </div>
      </div>

      {/* Main Simulation Board */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="w-full h-screen relative p-2"
      >
        <h3 className="mb-2 font-bold">Simulation</h3>
        {activeItems.map((item) => (
          <DraggableItem
            key={item.id}
            item={item}
            onDragStart={handleDragStart}
            style={{
              left: item.x,
              top: item.y,
              background: "#444",
              position: "absolute",
            }}
          />
        ))}

        {/* Results */}
        {results && (
          <div className="absolute right-4 bg-gray-900 p-4 rounded-xl w-96">
            <h4 className="font-bold">Results</h4>
            <p>Steel produced: {results.final_resources?.steel_produced}</p>
            <p>Total revenue: ${results.financial?.total_revenue}</p>
            <p>Revenue/hr: ${results.financial?.revenue_per_hour}</p>
          </div>
        )}
      </div>

    </div>
  );
}
