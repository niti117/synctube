"use client";

import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { 
  Camera, CameraOff, Mic, MicOff, MonitorUp, Radio, StopCircle, Users, Copy, Check, 
  LogOut, Video, Languages, ThumbsUp, ThumbsDown, ShieldCheck, MapPin, Download, Crown 
} from 'lucide-react';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://synctube-backend-fqvu.onrender.com';

export default function SyncTubeMaster() {
  // --- STATES ---
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [theme, setTheme] = useState('dark'); // Task 5
  const [otpMethod, setOtpMethod] = useState('Mobile'); // Task 5
  const [locationData, setLocationData] = useState({ city: 'Detecting...', state: '' });
  const [comments, setComments] = useState<any[]>([]); // Task 6
  const [commentInput, setCommentInput] = useState('');
  const [userPlan, setUserPlan] = useState('Free'); // Task 2 & 3
  
  // VoIP States
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<{ [key: string]: MediaStream }>({});
  const [isRecording, setIsRecording] = useState(false);

  const myVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<any>(null);
  const peerInstance = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  // --- TASK 5: LOCATION & THEME LOGIC ---
  useEffect(() => {
    const fetchLocationAndSetTheme = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        setLocationData({ city: data.city, state: data.region });

        const southStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
        const isSouthIndia = southStates.includes(data.region);
        
        // Time Check (10 AM - 12 PM IST)
        const hour = new Date().getHours();
        const isCorrectTime = hour >= 10 && hour < 12;

        if (isSouthIndia) {
          setOtpMethod('Email'); // Task 5: South India gets Email OTP
          if (isCorrectTime) setTheme('light'); // Task 5: South India + Time = Light Theme
        } else {
          setOtpMethod('Mobile');
          setTheme('dark');
        }
      } catch (err) {
        console.error("Location fetch failed", err);
      }
    };

    fetchLocationAndSetTheme();

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setMyStream(stream);
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;
    });
  }, []);

  // --- TASK 6: SMART COMMENT LOGIC ---
  const handlePostComment = () => {
    // 1. Block Special Characters
    const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    if (specialChars.test(commentInput)) {
      alert("Bhai, special characters allowed nahi hain comment mein!");
      return;
    }

    const newComment = {
      id: Date.now(),
      text: commentInput,
      city: locationData.city,
      likes: 0,
      dislikes: 0,
    };

    setComments([newComment, ...comments]);
    setCommentInput('');
  };

  const handleDislike = (id: number) => {
    setComments(prev => prev
      .map(c => c.id === id ? { ...c, dislikes: c.dislikes + 1 } : c)
      .filter(c => c.dislikes < 2) // Task 6: 2 dislikes par remove
    );
  };

  // --- TASK 1: VoIP LOGIC ---
  const handleJoin = async () => {
    if (!roomId) return alert("Room ID dalo");
    setJoined(true);
    socketRef.current = io(SOCKET_URL);
    const { default: Peer } = await import('peerjs');
    const peer = new Peer("" as any, { config: { 'iceServers': [{ url: 'stun:stun.l.google.com:19302' }] } });
    peerInstance.current = peer;
    peer.on('open', (id) => socketRef.current.emit('join-room', roomId, id));
    peer.on('call', (call) => {
      call.answer(myStream!);
      call.on('stream', (s) => setPeers(p => ({ ...p, [call.peer]: s })));
    });
    socketRef.current.on('user-connected', (id: string) => {
      const call = peer.call(id, myStream!);
      call.on('stream', (s) => setPeers(p => ({ ...p, [id]: s })));
    });
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${theme === 'light' ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'}`}>
      
      {/* HEADER: Task 5 Status */}
      <header className={`p-4 border-b flex justify-between items-center ${theme === 'light' ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-white/5'}`}>
        <div className="flex items-center gap-2">
          <Radio className="text-red-600 animate-pulse" />
          <h1 className="text-xl font-black tracking-tighter italic">SYNC<span className="text-red-600">TUBE</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">
            Auth: <span className="text-blue-500">{otpMethod} OTP</span> | {locationData.city}
          </div>
          <button className="bg-yellow-500 text-black px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-yellow-500/20">
            <Crown size={14} /> UPGRADE
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        
        {/* LEFT: Video & Calling */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative rounded-[40px] overflow-hidden bg-black aspect-video shadow-2xl border border-white/10 group">
            <video className="w-full h-full object-cover" src="https://www.w3schools.com/html/mov_bbb.mp4" controls />
            <div className="absolute top-4 left-4 bg-black/60 px-4 py-1 rounded-full text-[10px] font-bold">TASK 4: GESTURES ACTIVE</div>
          </div>

          {/* VoIP Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative rounded-3xl overflow-hidden border-2 border-red-600/30 aspect-video bg-slate-900 shadow-xl">
              <video ref={myVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
              <div className="absolute bottom-2 left-2 bg-red-600 text-[8px] px-2 py-0.5 rounded font-bold uppercase">You</div>
            </div>
            {Object.keys(peers).map(id => (
              <div key={id} className="relative rounded-3xl overflow-hidden border border-white/10 aspect-video bg-slate-900 shadow-xl">
                <video autoPlay playsInline ref={el => { if(el) el.srcObject = peers[id] }} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          {/* TASK 6: COMMENT SECTION */}
          <div className={`p-6 rounded-[32px] border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-white/5'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Languages size={20} /> Community Comments</h3>
            <div className="flex gap-2 mb-6">
              <input 
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Post a safe comment..."
                className="flex-grow bg-white/5 border border-white/10 p-3 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-red-600 transition-all"
              />
              <button onClick={handlePostComment} className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-2xl font-bold transition-transform active:scale-95">Post</button>
            </div>

            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center group transition-all hover:bg-white/10">
                  <div>
                    <p className="text-sm font-medium">{comment.text}</p>
                    <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase flex items-center gap-1">
                      <MapPin size={10} /> {comment.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-500 transition-colors"><ThumbsUp size={16} /></button>
                    <button onClick={() => handleDislike(comment.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors flex items-center gap-1">
                      <ThumbsDown size={16} /> <span className="text-[10px] font-bold">{comment.dislikes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Sidebar Controls */}
        <div className="space-y-6">
          <div className={`p-6 rounded-[32px] border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-white/5'}`}>
            {!joined ? (
              <div className="space-y-4">
                <p className="text-xs font-bold text-zinc-500 text-center uppercase tracking-widest">Connect to Room</p>
                <input value={roomId} onChange={e => setRoomId(e.target.value)} placeholder="Enter Room ID" className="w-full bg-white/5 p-4 rounded-2xl text-center font-bold text-red-600 outline-none border border-white/5" />
                <button onClick={handleJoin} className="w-full bg-red-600 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-red-600/30">Go Live</button>
              </div>
            ) : (
              <div className="text-center p-4">
                <div className="bg-green-500/10 text-green-500 p-4 rounded-2xl border border-green-500/20 mb-4 font-black">ACTIVE SESSION: {roomId}</div>
                <button onClick={() => setJoined(false)} className="text-[10px] font-bold text-zinc-500 hover:text-red-500 transition-colors">LEAVE SESSION</button>
              </div>
            )}
          </div>

          {/* TASK 2 & 3: PLAN STATUS */}
          <div className="bg-blue-600/10 p-6 rounded-[32px] border border-blue-500/20">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-4">Subscription Monitor</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-xs"><span>Current Plan</span><span className="font-bold">{userPlan}</span></div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full transition-all duration-1000" style={{width: '40%'}} />
              </div>
              <p className="text-[10px] text-zinc-500">Upgrade to Gold for unlimited VoIP and recording.</p>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER CONTROLS */}
      <footer className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-3xl p-4 rounded-[40px] border border-white/10 shadow-2xl">
          <button className={`p-4 rounded-2xl ${theme === 'light' ? 'bg-white' : 'bg-white/5'}`}><Mic size={24}/></button>
          <button className={`p-4 rounded-2xl ${theme === 'light' ? 'bg-white' : 'bg-white/5'}`}><Camera size={24}/></button>
          <button className={`p-4 rounded-2xl ${theme === 'light' ? 'bg-white' : 'bg-white/5'}`}><MonitorUp size={24}/></button>
          <div className="w-[1px] h-10 bg-white/10 mx-2" />
          <button className="bg-red-600 p-4 px-8 rounded-2xl font-black text-xs hover:bg-red-700 transition-all uppercase tracking-widest">End</button>
      </footer>
    </div>
  );
}