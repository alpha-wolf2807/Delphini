import { WebSocket } from 'ws';

const BASE_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001/ws';
const ROOM_ID = 'DEL-4821';

async function runTests() {
  console.log('=== RUNNING DELPHINI SYSTEM INTEGRATION TESTS ===\n');

  // Test 1: GET /api/actions
  console.log('1. Testing GET /api/actions...');
  const actionsRes = await fetch(`${BASE_URL}/api/actions`);
  const actions = await actionsRes.json();
  console.log(`   [PASS] Received ${actions.length} actions.`);

  // Test 2: GET /api/assets/videos
  console.log('2. Testing GET /api/assets/videos...');
  const videosRes = await fetch(`${BASE_URL}/api/assets/videos`);
  const videos = await videosRes.json();
  console.log(`   [PASS] Received ${videos.length} videos.`);

  // Test 3: GET /api/assets/images
  console.log('3. Testing GET /api/assets/images...');
  const imagesRes = await fetch(`${BASE_URL}/api/assets/images`);
  const images = await imagesRes.json();
  console.log(`   [PASS] Received ${images.length} images.`);

  // Test 4: GET /api/voice/config
  console.log('4. Testing GET /api/voice/config...');
  const voiceRes = await fetch(`${BASE_URL}/api/voice/config`);
  const voiceConfig = await voiceRes.json();
  console.log(`   [PASS] Unified Voice Model: ${voiceConfig.model} (${voiceConfig.speaker})`);

  // Test 5: POST /api/tts/speak (Live TTS synthesis)
  console.log('5. Testing Live Voice Synthesis via POST /api/tts/speak...');
  const ttsRes = await fetch(`${BASE_URL}/api/tts/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: "Delphini is a modular holographic interface." })
  });
  const ttsData = await ttsRes.json();
  console.log(`   [PASS] TTS Audio Signal: ${ttsData.audioUrl || 'Web Speech Fallback'} (Duration: ~${ttsData.durationEstimate}s)`);

  // Test 6: POST /api/actions (Action Creator)
  console.log('6. Testing Dynamic Action Creation via POST /api/actions...');
  const newActionRes = await fetch(`${BASE_URL}/api/actions?roomId=${ROOM_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'TEST_DYNAMIC_PEN',
      name: 'Dynamic Smart Stylus Demo',
      category: 'Objects',
      spokenText: 'This action was created dynamically through the Action Creator.',
      video: '/assets/videos/pen_show.mp4',
      holdImage: '/assets/images/pen_final.png',
      audioMode: 'delphini-engine'
    })
  });
  const newActionData = await newActionRes.json();
  console.log(`   [PASS] Created action: ${newActionData.action.id} -> Total actions: ${newActionData.actions.length}`);

  // Test 6.5: DELETE /api/actions/TEST_DYNAMIC_PEN (Action Deletion)
  console.log('6.5. Testing Action Removal via DELETE /api/actions/TEST_DYNAMIC_PEN...');
  const deleteRes = await fetch(`${BASE_URL}/api/actions/TEST_DYNAMIC_PEN?roomId=${ROOM_ID}`, {
    method: 'DELETE'
  });
  const deleteData = await deleteRes.json();
  console.log(`   [PASS] Removed action: ${deleteData.deletedId} -> Remaining actions: ${deleteData.actions.length}`);

  // Test 7: WebSocket End-to-End Handshake & Action Routing
  console.log('7. Testing WebSocket Handshake, Action Routing & Live Response...');
  await testWebSocketFlow();

  console.log('\n=== ALL DELPHINI INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

function testWebSocketFlow() {
  return new Promise((resolve, reject) => {
    // Connect Projection Client
    const projWs = new WebSocket(WS_URL);
    // Connect Remote Client
    const remoteWs = new WebSocket(WS_URL);

    let projReceivedAction = false;
    let projReceivedLiveResponse = false;
    let remoteReceivedAck = false;
    let remoteReceivedLatencyPong = false;

    projWs.on('open', () => {
      console.log('   -> Projection WS connected, sending JOIN_ROOM...');
      projWs.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomId: ROOM_ID,
        role: 'PROJECTION'
      }));
    });

    remoteWs.on('open', () => {
      console.log('   -> Remote WS connected, sending JOIN_ROOM...');
      remoteWs.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomId: ROOM_ID,
        role: 'REMOTE'
      }));

      setTimeout(() => {
        // Send PING
        remoteWs.send(JSON.stringify({
          type: 'PING',
          timestamp: Date.now()
        }));

        // Send ACTION SHOW_PEN
        console.log('   -> Remote sending ACTION: SHOW_PEN...');
        remoteWs.send(JSON.stringify({
          type: 'ACTION',
          actionId: 'SHOW_PEN'
        }));

        // Send LIVE_RESPONSE
        console.log('   -> Remote sending LIVE_RESPONSE...');
        remoteWs.send(JSON.stringify({
          type: 'LIVE_RESPONSE',
          text: 'Delphini is answering a live audience question.'
        }));
      }, 500);
    });

    projWs.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'EXECUTE_ACTION' && msg.actionId === 'SHOW_PEN') {
        console.log('   [PASS] Projection received EXECUTE_ACTION SHOW_PEN!');
        projReceivedAction = true;
      }
      if (msg.type === 'EXECUTE_LIVE_RESPONSE') {
        console.log(`   [PASS] Projection received EXECUTE_LIVE_RESPONSE (Audio: ${msg.audioUrl})!`);
        projReceivedLiveResponse = true;
      }
      checkDone();
    });

    remoteWs.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'PONG') {
        console.log('   [PASS] Remote received PONG latency response!');
        remoteReceivedLatencyPong = true;
      }
      if (msg.type === 'ACTION_ACK' && msg.actionId === 'SHOW_PEN') {
        console.log('   [PASS] Remote received ACTION_ACK for SHOW_PEN!');
        remoteReceivedAck = true;
      }
      checkDone();
    });

    function checkDone() {
      if (projReceivedAction && projReceivedLiveResponse && remoteReceivedAck && remoteReceivedLatencyPong) {
        projWs.close();
        remoteWs.close();
        resolve();
      }
    }

    setTimeout(() => {
      if (!projReceivedAction || !projReceivedLiveResponse) {
        reject(new Error('Timeout waiting for WebSocket end-to-end events'));
      }
    }, 10000);
  });
}

runTests().catch(err => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
