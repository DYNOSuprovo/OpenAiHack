import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Activity, Cpu, Database, Wifi, AlertTriangle, CheckCircle, Battery, Signal, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Pause, RotateCcw, Compass, ZapOff, Scan, Microscope, Rewind, PlusCircle, Mountain, Aperture, BarChart3, Camera, Eye, Layers } from 'lucide-react';

// --- Components ---

const MetricCard = ({ title, children, className = "" }) => (
  <div className={`bg-slate-900/90 border border-slate-700 p-4 rounded-lg shadow-lg backdrop-blur-sm ${className}`}>
    <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
      {title}
    </h3>
    {children}
  </div>
);

const Badge = ({ type, children }) => {
  const colors = {
    nominal: "bg-cyan-950 text-cyan-400 border-cyan-800",
    success: "bg-emerald-950 text-emerald-400 border-emerald-800",
    warning: "bg-amber-950 text-amber-400 border-amber-800",
    danger: "bg-red-950 text-red-400 border-red-800",
    critical: "bg-red-600 text-white border-red-500 animate-pulse"
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${colors[type] || colors.nominal} whitespace-nowrap flex items-center gap-1`}>
      {children}
    </span>
  );
};

// --- Main Application ---

export default function MarsMissionControl() {
  const mountRef = useRef(null);

  // --- App State ---
  const [aiEnabled, setAiEnabled] = useState(true);
  const [cameraView, setCameraView] = useState('ORBIT'); // 'ORBIT' or 'DRIVER'
  const [visionMode, setVisionMode] = useState(false); // Toggle for AI Overlay
  const [emergencyStop, setEmergencyStop] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [failsafeTimer, setFailsafeTimer] = useState(5);

  // Metrics
  const [speed, setSpeed] = useState(0);
  const [cpuLoad, setCpuLoad] = useState(45);
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [aiState, setAiState] = useState("IDLE");

  // Science & Vision State
  const [bandwidthSaved, setBandwidthSaved] = useState(94);
  const [dataProcessed, setDataProcessed] = useState(14.2);
  const [scanProgress, setScanProgress] = useState(0);
  const [analysisData, setAnalysisData] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]); // For HUD overlay
  const [scienceTargets, setScienceTargets] = useState([
    { id: 'init-1', title: 'Target A-42', tags: ['Hydrated Silica'], composition: 'Si: 88%, O: 12%', score: 98, status: 'pending', color: 'bg-amber-700' },
    { id: 'init-2', title: 'Target B-11', tags: ['Basaltic'], composition: 'Fe: 24%, Mg: 18%', score: 85, status: 'pending', color: 'bg-slate-600' },
  ]);

  const [logs, setLogs] = useState([
    { id: 'init', time: "14:02:01", msg: "System Initialized. AEGIS II Online.", type: "nominal" },
  ]);

  // Logic Refs
  const lastLogTime = useRef(0);
  const lastVisionLogTime = useRef(0);
  const avoidanceTrend = useRef(0);

  const addLog = useCallback((msg, type = "nominal") => {
    const time = new Date().toISOString().split('T')[1].split('.')[0];
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setLogs(prev => [{ id: uniqueId, time, msg, type }, ...prev].slice(0, 7));
  }, []);

  const addNewFoundTarget = useCallback((mineralType) => {
    const id = `AUTO-${Math.floor(Math.random() * 1000)}`;
    const score = 85 + Math.floor(Math.random() * 15);

    let comp = "Unknown";
    if (mineralType === "Hematite") comp = "Fe₂O₃: 92%";
    else if (mineralType === "Olivine") comp = "(Mg,Fe)₂SiO₄";
    else if (mineralType === "Silica") comp = "SiO₂: 98%";
    else comp = "Complex Silicate";

    const newTarget = {
      id,
      title: `Sample ${id}`,
      tags: [mineralType, 'AI Detected'],
      composition: comp,
      score,
      status: 'pending',
      color: 'bg-cyan-900 border-cyan-500',
      hasVisual: true
    };
    setScienceTargets(prev => [newTarget, ...prev]);
    addLog(`ANALYSIS COMPLETE: ${mineralType} identified. Processed visual uplinking...`, "success");
  }, [addLog]);

  // --- Connection Loss Logic ---
  useEffect(() => {
    let interval;
    if (connectionStatus === 'lost') {
      interval = setInterval(() => {
        setFailsafeTimer(prev => {
          if (prev <= 1) {
            setConnectionStatus('connected');
            setAiEnabled(true);
            addLog("CRITICAL: SIGNAL LOST. FAILSAFE TRIGGERED.", "danger");
            addLog("AI AUTONOMY ENGAGED. MISSION CONTINUES.", "success");
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setFailsafeTimer(5);
    }
    return () => clearInterval(interval);
  }, [connectionStatus, addLog]);

  const handleScienceAction = (id, action) => {
    if (connectionStatus === 'lost') return;
    setScienceTargets(prev => prev.map(t => {
      if (t.id !== id) return t;
      return { ...t, status: action };
    }));
    if (action === 'accepted') {
      addLog(`Target ${id} queued for uplink. Priority High.`, "success");
      setDataProcessed(prev => +(prev + 0.05).toFixed(2));
    } else {
      addLog(`Target ${id} discarded. Bandwidth conserved.`, "nominal");
      setBandwidthSaved(prev => Math.min(prev + 0.1, 99.9).toFixed(1));
    }
  };

  // --- Three.js & Simulation Logic ---
  useEffect(() => {
    if (!mountRef.current) return;

    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    // Init Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, 0.015, 50);

    const camera = new THREE.PerspectiveCamera(60, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambLight);
    const dirLight = new THREE.DirectionalLight(0xffccaa, 1.5);
    dirLight.position.set(20, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // --- Terrain Engine (Endless) ---
    const getTerrainHeight = (x, z) => {
      return (Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2) + (Math.sin(x * 0.3 + z * 0.2) * 0.5);
    };

    const TERRAIN_SIZE = 120;
    const TERRAIN_RES = 60;
    const terrainGeo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_RES, TERRAIN_RES);
    terrainGeo.rotateX(-Math.PI / 2);

    const terrainMat = new THREE.MeshStandardMaterial({ color: 0x8c5e45, roughness: 0.8, flatShading: true });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    scene.add(terrain);

    const wireframeMat = new THREE.MeshBasicMaterial({ color: 0x334155, wireframe: true, transparent: true, opacity: 0.1 });
    const terrainWire = new THREE.Mesh(terrainGeo, wireframeMat);
    scene.add(terrainWire);

    const updateTerrainMesh = (centerX, centerZ) => {
      const posAttr = terrainGeo.attributes.position;
      terrain.position.set(centerX, 0, centerZ);
      terrainWire.position.set(centerX, 0, centerZ);

      for (let i = 0; i < posAttr.count; i++) {
        const localX = (i % (TERRAIN_RES + 1)) * (TERRAIN_SIZE / TERRAIN_RES) - (TERRAIN_SIZE / 2);
        const localZ = Math.floor(i / (TERRAIN_RES + 1)) * (TERRAIN_SIZE / TERRAIN_RES) - (TERRAIN_SIZE / 2);
        const y = getTerrainHeight(posAttr.getX(i) + centerX, posAttr.getZ(i) + centerZ);
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
      terrainGeo.computeVertexNormals();
    };

    // --- Rover ---
    const rover = new THREE.Group();
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 2), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 }));
    chassis.position.y = 0.7;
    chassis.castShadow = true;
    rover.add(chassis);

    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    [[-0.8, 0.4, 0.8], [0.8, 0.4, 0.8], [-0.8, 0.4, -0.8], [0.8, 0.4, -0.8], [-0.9, 0.4, 0], [0.9, 0.4, 0]].forEach(pos => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(...pos);
      w.castShadow = true;
      rover.add(w);
    });

    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), new THREE.MeshStandardMaterial({ color: 0xcbd5e1 }));
    mast.position.set(0.5, 1.3, -0.6);
    rover.add(mast);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
    head.position.set(0.5, 1.9, -0.6);
    rover.add(head);
    const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    eye.rotation.x = Math.PI / 2;
    eye.position.set(0, 0, -0.25);
    head.add(eye);
    scene.add(rover);

    // --- Hazards & Targets ---
    const obstacles = [];
    const scienceProps = [];
    const ROVER_RADIUS = 1.5;
    const OBS_RADIUS = 2.0;
    const SAFETY_MARGIN = 2.5;

    const spawnObject = (obj, minDist, maxDist) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = minDist + Math.random() * (maxDist - minDist);
      const worldX = rover.position.x + Math.cos(angle) * radius;
      const worldZ = rover.position.z + Math.sin(angle) * radius;

      obj.position.set(worldX, 0, worldZ);
      obj.position.y = getTerrainHeight(worldX, worldZ);
      obj.visible = true;
      if (obj.userData.type) obj.userData.processed = false;
    };

    for (let i = 0; i < 20; i++) {
      const obs = new THREE.Mesh(
        new THREE.SphereGeometry(Math.random() * 0.8 + 0.5, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xef4444, wireframe: true, transparent: true, opacity: 0.8 })
      );
      obs.userData = { radius: OBS_RADIUS, type: 'HAZARD' };
      spawnObject(obs, 10, 60);
      obstacles.push(obs);
      scene.add(obs);
    }

    const mineralTypes = ["Hematite", "Olivine", "Sulfate", "Silica", "Magmatite"];
    for (let i = 0; i < 8; i++) {
      const sci = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.6),
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.8, roughness: 0.2, emissive: 0x06b6d4, emissiveIntensity: 0.2 })
      );
      sci.userData = {
        processed: false,
        id: i,
        radius: 1.0,
        type: mineralTypes[Math.floor(Math.random() * mineralTypes.length)]
      };
      spawnObject(sci, 10, 60);
      scienceProps.push(sci);
      scene.add(sci);
    }

    // --- Lidar/Scan Visuals ---
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
    const lidarLine = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2 }));
    scene.add(lidarLine);

    const slopeLineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
    const slopeLine = new THREE.Line(slopeLineGeo, new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 2 }));
    slopeLine.visible = false;
    scene.add(slopeLine);

    // --- Simulation State ---
    let roverPos = new THREE.Vector3(0, 0, 0);
    let roverDir = 0;
    let targetSpeed = 0;
    let currentSimSpeed = 0;
    let targetRot = 0;
    let frameCount = 0;
    let scanTimer = 0;
    let stuckTimer = 0;
    let currentTarget = null;
    let animationFrameId;

    // ULTRA SLOW REALISTIC SPEEDS
    const AI_CRUISE_SPEED = 0.02;  // ~3 cm/s scale
    const MANUAL_SPEED = 0.03;
    const RECYCLE_DIST = 70;

    const input = { up: false, down: false, left: false, right: false };

    // --- Animation Loop ---
    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);

      if (frameCount % 5 === 0) {
        updateTerrainMesh(roverPos.x, roverPos.z);
      }

      [...obstacles, ...scienceProps].forEach(obj => {
        if (roverPos.distanceTo(obj.position) > RECYCLE_DIST) {
          spawnObject(obj, 40, 80);
        }
      });

      // --- Vision Processing (Object Detection Simulation) ---
      // Calculate screen positions for HUD only if Vision Mode is on
      if (frameCount % 5 === 0) {
        const visibleObjects = [];
        // Project 3D coords to 2D screen
        [...obstacles, ...scienceProps].forEach(obj => {
          if (roverPos.distanceTo(obj.position) < 25) {
            // Simple distance check for demo instead of full frustum culling
            // Calculate screen position (normalized -1 to 1)
            const vec = obj.position.clone();
            vec.project(camera);

            // Check if in front of camera
            if (vec.z < 1 && vec.x > -0.9 && vec.x < 0.9 && vec.y > -0.9 && vec.y < 0.9) {
              visibleObjects.push({
                id: obj.uuid,
                x: (vec.x * 0.5 + 0.5) * 100, // %
                y: (-(vec.y) * 0.5 + 0.5) * 100, // %
                type: obj.userData.type || 'MINERAL',
                dist: roverPos.distanceTo(obj.position).toFixed(1),
                position: obj.position // Add 3D Position for logging
              });
            }
          }
        });
        // Note: We will read this state in the React render, might be slightly delayed but ok for HUD
        setDetectedObjects(visibleObjects);

        // --- AUTOMATED VISION LOGGING (New Logic) ---
        // Only trigger if in Driver Cam mode and enough time has passed
        if (cameraView === 'DRIVER' && Date.now() - lastVisionLogTime.current > 5000) {
          if (visibleObjects.length > 0) {
            // Prioritize Science Targets for logs
            const priorityTarget = visibleObjects.find(o => o.type !== 'HAZARD') || visibleObjects[0];
            const logType = priorityTarget.type === 'HAZARD' ? 'warning' : 'nominal';
            const { x, y, z } = priorityTarget.position;
            // LOG COORDS INSTEAD OF DISTANCE
            addLog(`NAV-CAM: ${priorityTarget.type} at [${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}]`, logType);
            lastVisionLogTime.current = Date.now();
          }
        }
      }


      // --- AI & State Logic ---
      let currentState = "IDLE";
      let rotInput = 0;
      let speedInput = 0;

      // Check if stuck (trying to move but stationary)
      if (Math.abs(targetSpeed) > 0.005 && Math.abs(currentSimSpeed) < 0.001) stuckTimer++;
      else stuckTimer = Math.max(0, stuckTimer - 1);

      // Scan for passive targets
      let passiveTarget = null;
      let passiveDist = 999;
      scienceProps.forEach(sci => {
        if (sci.userData.processed) return;
        const dist = roverPos.distanceTo(sci.position);
        if (dist < passiveDist) { passiveDist = dist; passiveTarget = sci; }
      });

      // Trigger Scan
      if (passiveTarget && passiveDist < 5.0 && scanTimer === 0 && !currentTarget) {
        currentTarget = passiveTarget;
        scanTimer = 240; // 4 seconds
        setScanProgress(0);
        setAnalysisData({
          type: passiveTarget.userData.type,
          confidence: 75,
          spectroscopy: Array.from({ length: 10 }, () => Math.floor(Math.random() * 100))
        });
      } else if (scanTimer > 0 && currentTarget && roverPos.distanceTo(currentTarget.position) > 6.0) {
        scanTimer = 0; currentTarget = null; setScanProgress(0); setAnalysisData(null);
      }

      // CONTROL STATES
      if (stuckTimer > 120) {
        currentState = "RECOVERING (STUCK)";
        targetSpeed = -0.02; targetRot += 0.03; // Spin out
        if (stuckTimer > 240) stuckTimer = 0;
      }
      else if (emergencyStop || (connectionStatus === 'lost' && !aiEnabled)) {
        targetSpeed = 0; currentSimSpeed = 0;
      }
      else if (!aiEnabled) {
        // MANUAL
        if (input.up) speedInput = MANUAL_SPEED;
        if (input.down) speedInput = -MANUAL_SPEED;
        if (input.left) rotInput = 0.01;
        if (input.right) rotInput = -0.01;
        targetSpeed = speedInput;
        targetRot += rotInput;
        currentState = "MANUAL";
      }
      else {
        // AI MODE
        if (scanTimer > 0) {
          currentState = "ANALYZING";
          targetSpeed = 0;
        }
        else {
          // SENSING
          let nearestHazDist = 999;
          let nearestHaz = null;

          obstacles.forEach(obs => {
            const dist = roverPos.distanceTo(obs.position);
            const avoidanceDist = dist - (ROVER_RADIUS + obs.userData.radius + SAFETY_MARGIN);
            if (avoidanceDist < nearestHazDist) { nearestHazDist = avoidanceDist; nearestHaz = obs; }
          });

          // Slope Detection
          const lookAheadDist = 3.0;
          const lookAheadX = roverPos.x - Math.sin(roverDir) * lookAheadDist;
          const lookAheadZ = roverPos.z - Math.cos(roverDir) * lookAheadDist;
          const currentY = getTerrainHeight(roverPos.x, roverPos.z);
          const futureY = getTerrainHeight(lookAheadX, lookAheadZ);
          const slopeDiff = Math.abs(futureY - currentY);
          let slopeHazardDetected = slopeDiff > 1.5;
          if (slopeHazardDetected && lookAheadDist < nearestHazDist) {
            nearestHazDist = 1.0;
            nearestHaz = { position: new THREE.Vector3(lookAheadX, futureY, lookAheadZ) };
            slopeLine.visible = true;
            slopeLine.geometry.setFromPoints([
              new THREE.Vector3(roverPos.x, currentY + 1, roverPos.z),
              new THREE.Vector3(lookAheadX, futureY, lookAheadZ)
            ]);
          } else {
            slopeLine.visible = false;
          }

          // DECISION TREE
          if (nearestHazDist < 0) {
            currentState = "COLLISION DETECTED";
            currentSimSpeed = -0.02; targetSpeed = -0.02;
          }
          else if (nearestHazDist < 5.0) {
            // HAZARD AVOIDANCE (FLOW AROUND)
            lidarLine.visible = true;
            lidarLine.geometry.setFromPoints([rover.position, nearestHaz.position]);

            const roverForward = new THREE.Vector3(-Math.sin(roverDir), 0, -Math.cos(roverDir));
            const toObs = new THREE.Vector3().subVectors(nearestHaz.position, roverPos).normalize();
            const dot = roverForward.dot(toObs);

            // Narrower cone (0.9 = ~25 degrees) prevents stopping for side obstacles
            if (dot > 0.9 || nearestHazDist < 1.5) {
              currentState = slopeHazardDetected ? "AVOIDING SLOPE" : "OBSTACLE DETECTED";

              if (nearestHazDist < 1.5) {
                // Critical: Stop & Pivot
                targetSpeed = -0.01;
                const angleToHaz = Math.atan2(nearestHaz.position.x - roverPos.x, nearestHaz.position.z - roverPos.z);
                const diff = angleToHaz - roverDir;
                // Commit to turn direction
                if (avoidanceTrend.current === 0) avoidanceTrend.current = Math.sin(diff) > 0 ? -1 : 1;

                if (avoidanceTrend.current > 0) targetRot += 0.02; else targetRot -= 0.02;
                lidarLine.material.color.setHex(0xef4444);
              }
              else {
                // Flow Steering: Slow down but keep moving
                targetSpeed = AI_CRUISE_SPEED * 0.6;
                const angleToHaz = Math.atan2(nearestHaz.position.x - roverPos.x, nearestHaz.position.z - roverPos.z);
                const diff = angleToHaz - roverDir;

                if (Math.sin(diff) > 0) targetRot -= 0.02; else targetRot += 0.02;
                lidarLine.material.color.setHex(0xf59e0b);
              }
            } else {
              // Obstacle is peripheral -> Just drive
              avoidanceTrend.current = 0; // Reset turn lock
              currentState = "AVOIDING (CLEARING)";
              targetSpeed = AI_CRUISE_SPEED * 0.9;
              lidarLine.material.color.setHex(0x10b981);
            }
          }
          else if (passiveTarget && passiveDist < 30) {
            currentState = "APPROACHING TARGET";
            lidarLine.visible = true;
            lidarLine.material.color.setHex(0x06b6d4);
            lidarLine.geometry.setFromPoints([rover.position, passiveTarget.position]);

            if (passiveDist < 2.0) {
              targetSpeed = 0; currentSimSpeed = 0;
            } else {
              const angleToSci = Math.atan2(passiveTarget.position.x - roverPos.x, passiveTarget.position.z - roverPos.z);
              const angleDiff = angleToSci - roverDir;
              let normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
              targetRot += normalizedDiff * 0.03;
              targetSpeed = AI_CRUISE_SPEED;
            }
          }
          else {
            currentState = "EXPLORING";
            avoidanceTrend.current = 0;
            lidarLine.visible = false;
            slopeLine.visible = false;
            targetSpeed = AI_CRUISE_SPEED;
            targetRot += Math.sin(frameCount * 0.005) * 0.002;
          }
        }
      }

      // --- Execute Scan ---
      if (scanTimer > 0 && currentTarget) {
        scanTimer--;
        lidarLine.visible = true;
        lidarLine.material.color.setHex(0x06b6d4);
        lidarLine.geometry.setFromPoints([
          new THREE.Vector3(roverPos.x, roverPos.y + 1, roverPos.z),
          currentTarget.position
        ]);
        if (frameCount % 10 === 0 && analysisData) {
          setAnalysisData(prev => ({ ...prev, confidence: Math.min(99, prev.confidence + 1) }));
        }
        if (frameCount % 2 === 0) setScanProgress(prev => Math.min(100, prev + 0.8));

        if (scanTimer === 0) {
          currentTarget.visible = false;
          currentTarget.userData.processed = true;
          addNewFoundTarget(currentTarget.userData.type);
          currentTarget = null;
          setScanProgress(0);
          setAnalysisData(null);
          if (aiEnabled) targetSpeed = -0.05;
        }
      }

      // --- Physics Apply ---
      currentSimSpeed += (targetSpeed - currentSimSpeed) * 0.05;
      roverDir += (targetRot - roverDir) * 0.1;
      roverPos.x -= Math.sin(roverDir) * currentSimSpeed;
      roverPos.z -= Math.cos(roverDir) * currentSimSpeed;

      const yCenter = getTerrainHeight(roverPos.x, roverPos.z);
      const frontX = roverPos.x - Math.sin(roverDir) * 0.8;
      const frontZ = roverPos.z - Math.cos(roverDir) * 0.8;
      const yFront = getTerrainHeight(frontX, frontZ);
      const rightX = roverPos.x - Math.sin(roverDir - Math.PI / 2) * 0.6;
      const rightZ = roverPos.z - Math.cos(roverDir - Math.PI / 2) * 0.6;
      const yRight = getTerrainHeight(rightX, rightZ);

      const targetPitch = Math.atan2(yCenter - yFront, 0.8);
      const targetRoll = Math.atan2(yCenter - yRight, 0.6);

      rover.rotation.x += (targetPitch - rover.rotation.x) * 0.1;
      rover.rotation.z += (targetRoll - rover.rotation.z) * 0.1;
      rover.rotation.y = roverDir;
      rover.position.set(roverPos.x, yCenter + 0.6, roverPos.z);

      // --- Camera Control ---
      let targetCamPos;
      let targetLookAt = rover.position.clone();

      if (cameraView === 'DRIVER') {
        // Position camera on top of mast (approx coords)
        const driverOffset = new THREE.Vector3(0, 2.2, -0.5);
        driverOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), roverDir);
        targetCamPos = roverPos.clone().add(driverOffset);

        // Look forward relative to rover
        const lookOffset = new THREE.Vector3(0, 1.5, -10);
        lookOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), roverDir);
        targetLookAt = roverPos.clone().add(lookOffset);

        // Instant update for snappy driver feel, or very fast lerp
        camera.position.copy(targetCamPos);
      } else {
        // ORBIT MODE
        const camOffset = new THREE.Vector3(0, 4, 8);
        // Orbit logic if analyzing
        const orbitSpeed = (aiState === "ANALYZING" || aiState === "IDLE") ? frameCount * 0.002 : 0;
        const baseAngle = roverDir + orbitSpeed;
        camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), baseAngle);

        targetCamPos = roverPos.clone().add(camOffset);
        // Smooth lerp for orbit
        camera.position.lerp(targetCamPos, 0.05);
      }

      camera.lookAt(targetLookAt);

      // --- UI ---
      frameCount++;
      if (frameCount % 10 === 0) {
        setSpeed(Math.abs(currentSimSpeed * 100));
        setPitch((rover.rotation.x * (180 / Math.PI)).toFixed(0));
        setRoll((rover.rotation.z * (180 / Math.PI)).toFixed(0));
        setAiState(stuckTimer > 60 ? "STUCK DETECTED" : currentState);
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    const handleKeyDown = (e) => {
      if (aiEnabled || connectionStatus === 'lost') return;
      switch (e.key) {
        case 'ArrowUp': input.up = true; break;
        case 'ArrowDown': input.down = true; break;
        case 'ArrowLeft': input.left = true; break;
        case 'ArrowRight': input.right = true; break;
      }
    };
    const handleKeyUp = (e) => {
      switch (e.key) {
        case 'ArrowUp': input.up = false; break;
        case 'ArrowDown': input.down = false; break;
        case 'ArrowLeft': input.left = false; break;
        case 'ArrowRight': input.right = false; break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };

  }, [aiEnabled, emergencyStop, connectionStatus, addNewFoundTarget, cameraView]);


  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col relative">

      {/* --- Global Connection Loss Overlay --- */}
      {connectionStatus === 'lost' && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-[2px] pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-radial-gradient(#fff 0 0.0001%,#000 0 0.0002%)', backgroundSize: '100% 100%' }}></div>
          <div className="bg-red-950/90 border-2 border-red-500 p-8 rounded-xl max-w-md w-full text-center shadow-[0_0_100px_rgba(220,38,38,0.5)] animate-in zoom-in duration-300">
            <Wifi size={48} className="text-red-500 mx-auto mb-4 animate-ping" />
            <h2 className="text-2xl font-bold text-white mb-2 tracking-widest">SIGNAL LOST</h2>
            <p className="text-red-300 mb-6 font-mono text-sm">TELEMETRY DOWN. MANUAL CONTROL OFFLINE.</p>
            <div className="bg-black/50 rounded p-4 border border-red-900/50">
              <div className="text-xs text-slate-400 uppercase mb-2">Failsafe Autonomy Timer</div>
              <div className="text-4xl font-mono text-red-500 font-bold">{failsafeTimer.toFixed(2)}s</div>
            </div>
          </div>
        </div>
      )}

      {/* --- Header --- */}
      <header className="h-12 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-white font-serif font-bold border border-white/50 text-xs">N</div>
            <h1 className="font-bold tracking-wider text-md">MISSION CONTROL <span className="text-slate-600 mx-2">|</span> MARS 2032</h1>
          </div>
          {connectionStatus === 'connected' ? (
            <Badge type="nominal">JPL-LINK: ACTIVE</Badge>
          ) : (
            <Badge type="critical">LINK: LOST</Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (connectionStatus === 'connected') {
                setConnectionStatus('lost');
                setAiEnabled(false);
                addLog("WARNING: UPLINK CARRIER LOST.", "danger");
              } else {
                setConnectionStatus('connected');
                addLog("Uplink re-established manually.", "success");
              }
            }}
            className={`px-3 py-1 rounded text-[10px] font-bold border transition-all ${connectionStatus === 'connected' ? 'border-red-900 text-red-900 hover:bg-red-900/20' : 'bg-emerald-600 text-white border-emerald-500'}`}
          >
            {connectionStatus === 'connected' ? 'SIMULATE SIGNAL LOSS' : 'FORCE RECONNECT'}
          </button>
          <div className="flex items-center gap-6 font-mono text-xs text-cyan-400 border-l border-slate-800 pl-4">
            <div className="flex items-center gap-2">
              <Battery size={14} />
              <span>78%</span>
            </div>
            <div className="bg-slate-900 px-3 py-1 rounded border border-slate-800 text-slate-400">
              SOL 4152 <span className="text-white ml-2">14:05:22</span>
            </div>
          </div>
        </div>
      </header>

      {/* --- Main Grid --- */}
      <main className="flex-1 grid grid-cols-12 gap-0 overflow-hidden relative">

        {/* --- LEFT: Telemetry --- */}
        <aside className="col-span-3 bg-slate-950 border-r border-slate-800 flex flex-col gap-3 p-3 overflow-y-auto z-10">

          <MetricCard title="HPSC AI CO-PROCESSOR">
            <div className="flex gap-4 items-center">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="36" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent"
                    strokeDasharray={226}
                    strokeDashoffset={226 - (226 * cpuLoad) / 100}
                    className={`${cpuLoad > 85 ? 'text-amber-500' : 'text-cyan-500'} transition-all duration-300`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold font-mono">{cpuLoad}%</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-[10px] uppercase text-slate-400 border-b border-slate-800 pb-1">
                  <span>Core Temp</span> <span className="text-emerald-400 font-mono">42°C</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase text-slate-400">
                  <span>Latency</span> <span className="text-cyan-400 font-mono">8ms</span>
                </div>
              </div>
            </div>
          </MetricCard>

          <MetricCard title="CHASSIS ATTITUDE">
            <div className="flex items-center justify-around py-2">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-2 border-slate-700 relative flex items-center justify-center bg-slate-900">
                  <div className="absolute w-full h-0.5 bg-cyan-500/30"></div>
                  <div className="w-12 h-1 bg-cyan-400 transition-transform duration-200" style={{ transform: `rotate(${roll}deg)` }}></div>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">ROLL: {roll}°</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-2 border-slate-700 relative flex items-center justify-center bg-slate-900 overflow-hidden">
                  <div className="absolute w-full h-0.5 bg-cyan-500/30"></div>
                  <div className="w-12 h-1 bg-emerald-400 transition-transform duration-200" style={{ transform: `translateY(${pitch * -1}px)` }}></div>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">PITCH: {pitch}°</div>
              </div>
            </div>
            {(Math.abs(pitch) > 20 || Math.abs(roll) > 20) && (
              <div className="mt-2 bg-amber-900/20 border border-amber-800 text-amber-400 text-[10px] px-2 py-1 rounded text-center animate-pulse">
                TERRAIN UNEVEN - TRACTION WARNING
              </div>
            )}
          </MetricCard>

          <MetricCard title="SYSTEM LOG" className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] pr-1">
              {logs.map(log => (
                <div key={log.id} className="flex gap-2 border-b border-slate-800/50 pb-1 animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="text-slate-500 whitespace-nowrap">{log.time}</span>
                  <span className={`${log.type === 'danger' ? 'text-red-400 font-bold' : log.type === 'warning' ? 'text-amber-400' : log.type === 'success' ? 'text-emerald-400' : 'text-cyan-400'}`}>
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </MetricCard>
        </aside>


        {/* --- CENTER: 3D & Controls --- */}
        <section className="col-span-6 bg-black relative flex flex-col overflow-hidden">

          <div className="flex-1 w-full h-full relative overflow-hidden bg-black group">
            {/* CAMERA FEED SIMULATION EFFECTS */}
            {cameraView === 'DRIVER' && (
              <>
                <div className="absolute inset-0 z-0 pointer-events-none opacity-20"
                  style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, #000 3px)' }}></div>
                <div className="absolute inset-0 z-0 pointer-events-none radial-gradient-vignette"></div>
                <div className="absolute top-4 right-4 text-cyan-500/50 font-mono text-xs">CAM-L: ACTIVE</div>
              </>
            )}

            <div ref={mountRef} className="absolute inset-0" />

            {/* Overlays */}
            {emergencyStop && (
              <div className="absolute inset-0 bg-red-900/20 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className="bg-black/90 border-2 border-red-500 p-8 rounded-xl text-center">
                  <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
                  <h2 className="text-3xl font-bold text-white mb-2">EMERGENCY HALT</h2>
                  <button onClick={() => { setEmergencyStop(false); addLog("Systems rebooted.", "nominal"); }} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded flex items-center gap-2 mx-auto mt-4">
                    <RotateCcw size={16} /> RESET
                  </button>
                </div>
              </div>
            )}

            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
              <Badge type={aiEnabled ? "success" : "warning"}>
                MODE: {aiEnabled ? "AI AUTONOMOUS" : "MANUAL OVERRIDE"}
              </Badge>
              <Badge type={
                aiState === 'COLLISION DETECTED' || aiState === 'RECOVERING (STUCK)' ? 'danger' :
                  aiState === 'OBSTACLE DETECTED' || aiState === 'AVOIDING SLOPE' ? 'warning' :
                    aiState === 'ANALYZING' ? 'success' : 'nominal'
              }>
                AI STATUS: {aiState}
              </Badge>
              <Badge type="nominal">
                VIEW: {cameraView === 'DRIVER' ? 'NAV-CAM (FWD)' : 'ORBITAL (EXT)'}
              </Badge>
            </div>

            {/* AI VISION OVERLAY */}
            {visionMode && detectedObjects.map((obj) => (
              <div
                key={obj.id}
                className="absolute z-20 border border-cyan-500/60 bg-cyan-500/10 pointer-events-none text-cyan-400 flex flex-col items-center animate-in fade-in duration-300"
                style={{
                  left: `${obj.x}%`,
                  top: `${obj.y}%`,
                  width: '60px',
                  height: '60px',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="absolute -top-4 text-[9px] font-mono bg-black/50 px-1 whitespace-nowrap">
                  {obj.type} {obj.dist}m
                </div>
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-1 h-1 bg-cyan-400 rounded-full opacity-50"></div>
                </div>
              </div>
            ))}

            {/* AI ANALYSIS MODE HUD */}
            {scanProgress > 0 && (
              <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">

                {/* Target Box */}
                <div className="w-64 h-64 border-2 border-cyan-500/50 relative flex flex-col items-center justify-center animate-pulse">
                  <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>

                  {/* Center Reticle */}
                  <div className="w-4 h-4 border border-cyan-500 rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                  </div>
                </div>

                {/* Analysis Data Panel */}
                <div className="absolute right-10 top-20 bg-slate-900/90 border border-cyan-500/30 p-4 rounded w-64 backdrop-blur-md animate-in slide-in-from-right-10">
                  <div className="flex items-center gap-2 text-cyan-400 mb-3 border-b border-cyan-500/30 pb-2">
                    <Aperture size={16} className="animate-spin-slow" />
                    <span className="font-mono text-xs font-bold tracking-widest">SPECTRAL ANALYSIS</span>
                  </div>

                  {/* Mock Graph */}
                  <div className="h-16 flex items-end justify-between gap-1 mb-3">
                    {analysisData?.spectroscopy?.map((val, i) => (
                      <div key={i} className="w-2 bg-cyan-500/50" style={{ height: `${val}%` }}></div>
                    ))}
                  </div>

                  <div className="space-y-2 font-mono text-[10px] text-slate-300">
                    <div className="flex justify-between">
                      <span>CONFIDENCE</span>
                      <span className="text-emerald-400">{analysisData?.confidence}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TYPE</span>
                      <span className="text-white">{analysisData?.type}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded overflow-hidden mt-2">
                      <div className="bg-cyan-500 h-full transition-all" style={{ width: `${scanProgress}%` }}></div>
                    </div>
                    <div className="text-center text-cyan-500 mt-1">CAPTURING...</div>
                  </div>
                </div>
              </div>
            )}

            {aiState === 'RECOVERING (STUCK)' && (
              <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-amber-900/80 px-6 py-2 rounded-lg border border-amber-500 text-center backdrop-blur animate-pulse">
                <div className="flex items-center justify-center gap-2 text-amber-100 text-xs font-bold">
                  <Rewind size={14} /> AUTO-RECOVERY: REVERSING
                </div>
              </div>
            )}

            {aiState === 'AVOIDING SLOPE' && (
              <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-red-900/80 px-6 py-2 rounded-lg border border-red-500 text-center backdrop-blur animate-pulse">
                <div className="flex items-center justify-center gap-2 text-red-100 text-xs font-bold">
                  <Mountain size={14} /> STEEP TERRAIN DETECTED
                </div>
              </div>
            )}
          </div>

          {/* Controls Dock */}
          <div className="h-24 bg-slate-900 border-t border-slate-800 flex items-center px-6 justify-between z-20 relative">
            {connectionStatus === 'lost' && (
              <div className="absolute inset-0 bg-slate-950/80 z-30 flex items-center justify-center">
                <span className="text-red-500 font-bold font-mono flex items-center gap-2"><ZapOff size={16} /> CONTROLS LOCKED</span>
              </div>
            )}

            <div className="flex items-center gap-4 w-1/3">
              <div className="relative w-16 h-16 bg-slate-800 rounded-full border-2 border-slate-700 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{speed.toFixed(1)}</span>
                <span className="text-[8px] text-slate-400 absolute bottom-3">cm/s</span>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Drive Status</div>
                <div className={`text-sm font-bold ${speed > 0 ? 'text-emerald-400' : 'text-slate-500'} flex items-center gap-2`}>
                  {speed > 0 ? <Activity size={14} className="animate-pulse" /> : <Pause size={14} />}
                  {speed > 0.02 ? "MOVING" : "IDLE"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-center w-1/3">
              {/* Camera Toggle */}
              <button
                onClick={() => setCameraView(prev => prev === 'ORBIT' ? 'DRIVER' : 'ORBIT')}
                className={`p-2 rounded border transition-all ${cameraView === 'DRIVER' ? 'bg-cyan-900/50 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                title="Toggle Camera View"
              >
                <Camera size={18} />
              </button>

              {/* Vision Toggle */}
              <button
                onClick={() => setVisionMode(!visionMode)}
                className={`p-2 rounded border transition-all ${visionMode ? 'bg-purple-900/50 border-purple-500 text-purple-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                title="Toggle AI Vision Overlay"
              >
                <Eye size={18} />
              </button>

              {/* Manual Controls */}
              {!aiEnabled && (
                <div className="flex gap-1 ml-4">
                  <button className="p-2 bg-slate-800 rounded hover:bg-cyan-900 active:bg-cyan-700 border border-slate-700"><ArrowLeft size={16} /></button>
                  <div className="flex flex-col gap-1">
                    <button className="p-1 bg-slate-800 rounded hover:bg-cyan-900 active:bg-cyan-700 border border-slate-700"><ArrowUp size={12} /></button>
                    <button className="p-1 bg-slate-800 rounded hover:bg-cyan-900 active:bg-cyan-700 border border-slate-700"><ArrowDown size={12} /></button>
                  </div>
                  <button className="p-2 bg-slate-800 rounded hover:bg-cyan-900 active:bg-cyan-700 border border-slate-700"><ArrowRight size={16} /></button>
                </div>
              )}

              <button
                onClick={() => {
                  setAiEnabled(!aiEnabled);
                  addLog(aiEnabled ? "Switching to Manual Control." : "AI Autonomy Engaged.", "warning");
                }}
                className={`ml-4 px-4 py-2 rounded font-bold text-xs transition-all border ${aiEnabled
                    ? 'bg-emerald-900/30 text-emerald-400 border-emerald-700 hover:bg-emerald-900/50'
                    : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700'
                  }`}
              >
                {aiEnabled ? "AI ACTIVE" : "ENABLE AI"}
              </button>
            </div>

            <div className="w-1/3 flex justify-end">
              <button
                onClick={() => { setEmergencyStop(true); addLog("EMERGENCY STOP TRIGGERED BY USER", "danger"); }}
                className="bg-red-950 border border-red-600 text-red-500 px-4 py-2 rounded hover:bg-red-600 hover:text-white font-bold text-xs"
              >
                STOP
              </button>
            </div>

          </div>
        </section>


        {/* --- RIGHT: Science --- */}
        <aside className="col-span-3 bg-slate-950 border-l border-slate-800 flex flex-col p-3 z-10">
          <MetricCard title="AEGIS II SCIENCE TRIAGE" className="flex-1 flex flex-col min-h-0">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-slate-800/50 p-2 rounded">
                <div className="text-[9px] text-slate-500 mb-1">PROCESSED</div>
                <div className="text-lg font-mono text-white">{dataProcessed} GB</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded border border-emerald-900/30">
                <div className="text-[9px] text-emerald-500/70 mb-1">BANDWIDTH SAVED</div>
                <div className="text-lg font-mono text-emerald-400">{bandwidthSaved}%</div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
              <span>Pending Review</span>
              <span className="text-cyan-400 animate-pulse">{scienceTargets.filter(t => t.status === 'pending').length} Active</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {scienceTargets.filter(t => t.status === 'pending').map((target) => (
                <div key={target.id} className={`bg-slate-800/40 border rounded p-2 group transition-all animate-in slide-in-from-right-4 ${target.color || 'border-slate-700'}`}>
                  <div className="flex gap-3 mb-2">
                    <div className={`w-12 h-12 ${target.color ? 'bg-cyan-900/50 text-cyan-200' : 'bg-slate-700'} rounded flex items-center justify-center shadow-inner shrink-0 relative overflow-hidden`}>
                      {/* Image Simulation */}
                      {target.hasVisual ? (
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900 to-black flex items-center justify-center">
                          <Layers size={16} />
                        </div>
                      ) : (
                        <div className="w-1/2 h-1/2 bg-white/20 rotate-45 backdrop-blur-sm"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-200 truncate">{target.title}</h4>
                      <div className="text-[9px] text-slate-400 mt-0.5 font-mono">{target.composition || 'Analyzing...'}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {target.tags.map(tag => (
                          <span key={tag} className="text-[8px] px-1 bg-slate-900 rounded text-slate-500 border border-slate-700">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleScienceAction(target.id, 'rejected')} className="flex-1 py-1 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-400 hover:bg-red-900/30 hover:text-red-400">REJECT</button>
                    <button onClick={() => handleScienceAction(target.id, 'accepted')} className="flex-1 py-1 bg-cyan-950/30 border border-cyan-800/50 rounded text-[10px] text-cyan-400 hover:bg-cyan-900/50 hover:text-cyan-200">UPLINK</button>
                  </div>
                </div>
              ))}
            </div>
          </MetricCard>
        </aside>

      </main>
    </div>
  );
}
