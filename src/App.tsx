import { useCallback, useEffect, useState } from 'react';
import {
    Background,
    Connection,
    Controls,
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    useEdgesState,
    useNodesState,
    Node,
    Edge,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { Sidebar } from './Sidebar';
import { DnDProvider } from './useDnD';

const initialNodes: any[] = [];

// Parse time and password parameters from URL
const getParamsFromURL = (): { time: { hour: number; minute: number; second: number } | null; password: string | null } => {
    const urlParams = new URLSearchParams(window.location.search);
    const timeParam = urlParams.get('time');
    const passwordParam = urlParams.get('password');

    let time = null;
    if (timeParam) {
        const [hour, minute, second] = timeParam.split(':').map(Number);

        if (!isNaN(hour) && !isNaN(minute) && !isNaN(second) &&
            hour >= 1 && hour <= 24 && minute >= 1 && minute <= 60 && second >= 1 && second <= 60) {
            time = { hour, minute, second };
        }
    }

    return { time, password: passwordParam };
};

// Check if nodes are connected in correct sequence
const verifyTimeSequence = (nodes: Node[], edges: Edge[], targetTime: { hour: number; minute: number; second: number }) => {
    // Find nodes with target time values
    const hourNode = nodes.find(node => node.data.label === `Hour ${targetTime.hour}`);
    const minuteNode = nodes.find(node => node.data.label === `Minute ${targetTime.minute}`);
    const secondNode = nodes.find(node => node.data.label === `Second ${targetTime.second}`);

    if (!hourNode || !minuteNode || !secondNode) return false;

    // Check if hour connects to minute and minute connects to second
    const hourToMinute = edges.some(edge =>
        edge.source === hourNode.id && edge.target === minuteNode.id
    );
    const minuteToSecond = edges.some(edge =>
        edge.source === minuteNode.id && edge.target === secondNode.id
    );

    return hourToMinute && minuteToSecond;
};

function DnDFlow() {
    const [nodes, _, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [targetTime, setTargetTime] = useState<{ hour: number; minute: number; second: number } | null>(null);
    const [password, setPassword] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState(false);

    useEffect(() => {
        const params = getParamsFromURL();
        setTargetTime(params.time);
        setPassword(params.password);
    }, []);

    useEffect(() => {
        if (targetTime) {
            const correct = verifyTimeSequence(nodes, edges, targetTime);
            setIsCorrect(correct);
        }
    }, [nodes, edges, targetTime]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [],
    );

    return (
        <div className="dndflow">
            <div className="status-bar">
                {targetTime ? (
                    <>
                        <div className="target-time">
                            Target: {targetTime.hour}:{targetTime.minute.toString().padStart(2, '0')}:{targetTime.second.toString().padStart(2, '0')}
                        </div>
                        <div className={`verification-status ${isCorrect ? 'correct' : 'incorrect'}`}>
                            {isCorrect ? '✓ Correct Connection!' : '✗ Incorrect or incomplete connection'}
                        </div>
                    </>
                ) : (
                    <div className="no-target">No time parameter provided in URL</div>
                )}
            </div>

            {isCorrect && password && (
                <div className="password-reveal">
                    <div className="password-label">🔓 Password:</div>
                    <div className="password-value">{password}</div>
                    <div className="password-copy">
                        <button
                            onClick={() => navigator.clipboard.writeText(password)}
                            className="copy-button"
                        >
                            Copy to Clipboard
                        </button>
                    </div>
                </div>
            )}

            <div className="reactflow-wrapper">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                >
                    <Controls />
                    <Background />
                </ReactFlow>
            </div>
            <Sidebar />
        </div>
    );
}

export default () => (
    <ReactFlowProvider>
        <DnDProvider>
            <DnDFlow />
        </DnDProvider>
    </ReactFlowProvider>
);
