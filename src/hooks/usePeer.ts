"use client";
import { useEffect, useState, useRef } from 'react';

// Bahut zaroori: 'export' keyword hona hi chahiye
export const usePeer = () => {
  const [peer, setPeer] = useState<any>(null);
  const [myId, setMyId] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Is line ko dhyan se dekho, {} (empty object) hona chahiye
  const [remoteStreams, setRemoteStreams] = useState<{ [key: string]: MediaStream }>({});
  
  const myVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const initPeer = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(localStream);
        if (myVideoRef.current) myVideoRef.current.srcObject = localStream;

        const { default: Peer } = await import('peerjs');
        const newPeer = new Peer();
        
        newPeer.on('open', (id) => setMyId(id));

        newPeer.on('call', (call) => {
          call.answer(localStream);
          call.on('stream', (incomingStream) => {
            setRemoteStreams((prev) => ({ ...prev, [call.peer]: incomingStream }));
          });
        });

        setPeer(newPeer);
      } catch (err) {
        console.error("Media error:", err);
      }
    };
    initPeer();
  }, []);

  const callUser = (id: string) => {
    if (!peer || !stream) return;
    const call = peer.call(id, stream);
    call.on('stream', (incomingStream: MediaStream) => {
      setRemoteStreams((prev) => ({ ...prev, [id]: incomingStream }));
    });
  };

  return { myId, myVideoRef, remoteStreams, callUser, peer, stream };
};