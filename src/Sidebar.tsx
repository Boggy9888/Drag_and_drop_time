import { useReactFlow, XYPosition } from '@xyflow/react';
import { useCallback, useState } from 'react';
import { OnDropAction, useDnD, useDnDPosition } from './useDnD';

// This is a simple ID generator for the nodes.
// You can customize this to use your own ID generation logic.
let id = 0;
const getId = () => `dndnode_${id++}`;

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export function Sidebar() {
    const { onDragStart, isDragging } = useDnD();
    // The type of the node that is being dragged.
    const [type, setType] = useState<string | null>(null);

    const { setNodes } = useReactFlow();

    // Create shuffled arrays for hours, minutes, and seconds
    const shuffledHours = shuffleArray(Array.from({ length: 24 }, (_, i) => i + 1));
    const shuffledMinutes = shuffleArray(Array.from({ length: 60 }, (_, i) => i + 1));
    const shuffledSeconds = shuffleArray(Array.from({ length: 60 }, (_, i) => i + 1));

    const createAddNewNode = useCallback(
        (nodeType: string, label: string): OnDropAction => {
            return ({ position }: { position: XYPosition }) => {
                // Here, we create a new node and add it to the flow.
                // You can customize the behavior of what happens when a node is dropped on the flow here.
                const newNode = {
                    id: getId(),
                    type: 'default',
                    position,
                    data: { label: label },
                };

                setNodes((nds) => nds.concat(newNode));
                setType(null);
            };
        },
        [setNodes, setType],
    );

    const createNodeHandler = (nodeType: string, label: string) => (event: React.PointerEvent<HTMLDivElement>) => {
        setType(nodeType);
        onDragStart(event, createAddNewNode(nodeType, label));
    };

    return (
        <>
            {/* The ghost node will be rendered at pointer position when dragging. */}
            {isDragging && <DragGhost type={type} />}
            <aside>
                <div className="description">
                    Drag time nodes to create a time display system.
                </div>

                <div className="node-section">
                    <h4>Hours (1-24)</h4>
                    <div className="node-grid">
                        {shuffledHours.map(hour => (
                            <div
                                key={`hour-${hour}`}
                                className="dndnode hour"
                                onPointerDown={createNodeHandler(`hour-${hour}`, `Hour ${hour}`)}
                            >
                                H{hour}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="node-section">
                    <h4>Minutes (1-60)</h4>
                    <div className="node-grid">
                        {shuffledMinutes.map(minute => (
                            <div
                                key={`minute-${minute}`}
                                className="dndnode minute"
                                onPointerDown={createNodeHandler(`minute-${minute}`, `Minute ${minute}`)}
                            >
                                M{minute}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="node-section">
                    <h4>Seconds (1-60)</h4>
                    <div className="node-grid">
                        {shuffledSeconds.map(second => (
                            <div
                                key={`second-${second}`}
                                className="dndnode second"
                                onPointerDown={createNodeHandler(`second-${second}`, `Second ${second}`)}
                            >
                                S{second}
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
        </>
    );
}

interface DragGhostProps {
    type: string | null;
}

// The DragGhost component is used to display a ghost node when dragging a node into the flow.
export function DragGhost({ type }: DragGhostProps) {
    const { position } = useDnDPosition();

    if (!position) return null;

    const getDisplayText = (type: string | null) => {
        if (!type) return '';

        if (type.startsWith('hour-')) {
            return `Hour ${type.split('-')[1]}`;
        } else if (type.startsWith('minute-')) {
            return `Minute ${type.split('-')[1]}`;
        } else if (type.startsWith('second-')) {
            return `Second ${type.split('-')[1]}`;
        }

        return type;
    };

    const getNodeClass = (type: string | null) => {
        if (!type) return '';

        if (type.startsWith('hour-')) return 'hour';
        if (type.startsWith('minute-')) return 'minute';
        if (type.startsWith('second-')) return 'second';

        return type;
    };

    return (
        <div
            className={`dndnode ghostnode ${getNodeClass(type)}`}
            style={{
                transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)`,
            }}
        >
            {getDisplayText(type)}
        </div>
    );
}
