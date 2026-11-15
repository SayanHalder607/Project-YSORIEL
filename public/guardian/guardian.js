(() => {
      'use strict';

      // --- State Management ---
      const GameState = {
        PLANNING: 'PLANNING',
        APPROACH: 'APPROACH',
        CAPTURE: 'CAPTURE',
        GAMEOVER: 'GAMEOVER'
      };

      const state = {
        current: GameState.PLANNING,
        selectedId: 1,
        fuel: 100,
        hull: 100,
        credits: 120,
        reputation: 0,
        missionNum: 1,
        nav: 72,
        arm: 60,
        upgraded: false,
        view: 'orbit',
        tugTarget: null,
        particles: []
      };

      const debris = [
        { id: 1, name: 'Defunct Weather Sat', type: 'Satellite', alt: 620, risk: 'High', fuelCost: 18, reward: 45, orbitR: 185, angle: 0.2, cleared: false },
        { id: 2, name: 'Upper-Stage Rocket', type: 'Rocket body', alt: 810, risk: 'High', fuelCost: 22, reward: 55, orbitR: 235, angle: 2.1, cleared: false },
        { id: 3, name: 'Fragment Cluster 7A', type: 'Fragment', alt: 430, risk: 'Medium', fuelCost: 12, reward: 30, orbitR: 145, angle: 4.2, cleared: false },
        { id: 4, name: 'Legacy Comm Sat', type: 'Satellite', alt: 980, risk: 'Medium', fuelCost: 16, reward: 40, orbitR: 280, angle: 3.1, cleared: false },
        { id: 5, name: 'Adapter Ring', type: 'Fragment', alt: 560, risk: 'Low', fuelCost: 10, reward: 25, orbitR: 165, angle: 5.4, cleared: false }
      ];

      // --- DOM Elements ---
      const $ = id => document.getElementById(id);
      const canvas = $('space');
      const ctx = canvas.getContext('2d');

      // --- UI Updates ---
      function updateUI() {
        const selectedDebris = debris.find(d => d.id === state.selectedId);
        
        // Top Bar
        $('ui-mission').textContent = String(state.missionNum).padStart(2, '0');
        $('ui-credits').textContent = state.credits;
        $('ui-rep').textContent = state.reputation;
        $('ui-phase').textContent = state.current;
        
        // Stats
        $('ui-fuel').innerHTML = `${Math.round(state.fuel)}<span class="unit">%</span>`;
        $('ui-hull').innerHTML = `${Math.round(state.hull)}<span class="unit">%</span>`;
        $('ui-cleared').innerHTML = `${debris.filter(d => d.cleared).length}<span class="unit">/ 5</span>`;

        // Systems
        $('ui-nav-bar').style.width = `${state.nav}%`;
        $('ui-nav-val').textContent = `${state.nav}%`;
        $('ui-arm-bar').style.width = `${state.arm}%`;
        $('ui-arm-val').textContent = `${state.arm}%`;

        // Buttons
        const canLaunch = selectedDebris && !selectedDebris.cleared && state.fuel >= selectedDebris.fuelCost;
        $('btn-launch').disabled = state.current !== GameState.PLANNING || !canLaunch;
        $('btn-upgrade').disabled = state.credits < 60 || state.upgraded || state.current !== GameState.PLANNING;
        $('btn-refuel').disabled = state.credits < 30 || state.fuel >= 100 || state.current !== GameState.PLANNING;

        // Objectives Panel
        const clearedCount = debris.filter(d => d.cleared).length;
        $('ui-objectives').innerHTML = `
          <div class="missioncard">
            <h3>Primary Objective</h3>
            <p>Remove all 5 catalogued objects from the simulated orbit.</p>
            <div class="bar" style="margin: 10px 0;"><span style="width:${(clearedCount / 5) * 100}%"></span></div>
            <p style="font-size: 12px; text-align: right;">${clearedCount} / 5 Cleared</p>
            
            <h3 style="margin-top: 20px;">Current Rank</h3>
            <p>${state.reputation < 60 ? 'Orbital Trainee' : state.reputation < 140 ? 'Debris Response Pilot' : 'Orbital Guardian'} · ${state.reputation} Rep</p>
          </div>
        `;

        renderTargets();
      }

      function renderTargets() {
        const container = $('ui-targets');
        container.innerHTML = '';
        
        debris.forEach(d => {
          const btn = document.createElement('button');
          btn.className = `target ${state.selectedId === d.id ? 'selected' : ''}`;
          btn.disabled = d.cleared || state.current !== GameState.PLANNING;
          
          const riskClass = d.risk === 'High' ? 'high' : d.risk === 'Low' ? 'low' : 'med';
          
          btn.innerHTML = `
            <span>
              <b>${d.cleared ? '✓ ' : ''}${d.name}</b>
              <small>${d.type} · ${d.alt}km · -${d.fuelCost} Fuel</small>
            </span>
            <span class="tag ${riskClass}">${d.cleared ? 'CLEAR' : d.risk}</span>
          `;
          
          btn.addEventListener('click', () => {
            if (state.current !== GameState.PLANNING) return;
            state.selectedId = d.id;
            updateUI();
          });
          
          container.appendChild(btn);
        });
      }

      function addLog(msg, type = '') {
        const p = document.createElement('p');
        p.className = type;
        p.innerHTML = `&gt; ${msg}`;
        const logBox = $('ui-log');
        logBox.prepend(p);
      }

      function showToast(msg) {
        const toast = $('toast');
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
      }

      // --- Canvas Rendering ---
      let tugPos = { x: -125, y: -65 };
      let lastTime = performance.now();

      function draw(time) {
        const dt = time - lastTime;
        lastTime = time;

        const w = canvas.width, h = canvas.height;
        const cx = w * 0.5, cy = h * 0.53;

        ctx.clearRect(0, 0, w, h);

        // Background
        const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 440);
        bgGrad.addColorStop(0, '#0b1d39');
        bgGrad.addColorStop(1, '#020610');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Stars
        for (let i = 0; i < 150; i++) {
          const sx = (i * 197 + 31) % w;
          const sy = (i * 113 + 19) % h;
          const alpha = 0.2 + (Math.sin(time * 0.001 + i) + 1) * 0.15; // Twinkle effect
          ctx.fillStyle = `rgba(180, 220, 255, ${alpha})`;
          ctx.fillRect(sx, sy, 1.5, 1.5);
        }

        // Orbit Rings
        debris.forEach(d => {
          ctx.beginPath();
          ctx.ellipse(cx, cy, d.orbitR, d.orbitR * 0.57, -0.14, 0, Math.PI * 2);
          ctx.strokeStyle = d.id === state.selectedId ? 'rgba(85, 230, 255, 0.4)' : 'rgba(92, 132, 183, 0.15)';
          ctx.lineWidth = d.id === state.selectedId ? 2 : 1;
          ctx.stroke();
        });

        // Earth
        const earthGrad = ctx.createRadialGradient(cx - 40, cy - 50, 8, cx, cy, 105);
        earthGrad.addColorStop(0, '#56d9ed');
        earthGrad.addColorStop(0.45, '#1769a3');
        earthGrad.addColorStop(1, '#081c45');
        ctx.beginPath();
        ctx.arc(cx, cy, 105, 0, Math.PI * 2);
        ctx.fillStyle = earthGrad;
        ctx.fill();

        // Earth Continents (Simplified)
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 105, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = 'rgba(39, 140, 155, 0.8)';
        for (let i = 0; i < 7; i++) {
          ctx.beginPath();
          ctx.ellipse(cx - 35 + i * 17, cy - 30 + (i % 3) * 35, 13, 28, i * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Earth Glow
        ctx.strokeStyle = '#59c9ff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy, 109, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Header Text
        ctx.fillStyle = '#b6d7f6';
        ctx.font = 'bold 14px system-ui';
        const headerText = state.view === 'risk' ? 'RELATIVE CLOSE-APPROACH RISK' : 
                           state.view === 'altitude' ? 'OBJECTS BY ORBITAL ALTITUDE' : 
                           'EARTH ORBIT · SIMULATED';
        ctx.fillText(headerText, 24, 32);

        // Debris Objects
        debris.forEach(d => {
          if (!d.cleared) {
            d.angle += (dt * 0.00015) * (620 / d.alt); // Orbit speed
          }
          
          const x = cx + Math.cos(d.angle) * d.orbitR;
          const y = cy + Math.sin(d.angle) * d.orbitR * 0.57;
          d.x = x; d.y = y; // Store for click detection

          if (d.cleared) {
            ctx.fillStyle = '#70f0b1';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            return;
          }

          // Color logic based on view
          let color = d.id === state.selectedId ? '#ff6b7a' : '#d6a0ff';
          if (state.view === 'risk') color = d.risk === 'High' ? '#ff4059' : d.risk === 'Medium' ? '#ffd166' : '#70f0b1';
          if (state.view === 'altitude') color = d.alt > 800 ? '#ff6b7a' : d.alt > 550 ? '#ffd166' : '#55e6ff';

          // Draw Object
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, d.id === state.selectedId ? 7 : 5, 0, Math.PI * 2);
          ctx.fill();

          // Selection Ring
          if (d.id === state.selectedId && !d.cleared) {
            const pulse = 12 + Math.sin(time * 0.005) * 3;
            ctx.strokeStyle = '#55e6ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, pulse, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Labels
          ctx.font = '11px system-ui';
          ctx.fillStyle = '#d9eaff';
          ctx.fillText(`D${d.id}`, x + 10, y - 10);
        });

        // Tug Movement (Lerp)
        if (state.tugTarget) {
          tugPos.x += (state.tugTarget.x - cx - tugPos.x) * 0.05;
          tugPos.y += (state.tugTarget.y - cy - tugPos.y) * 0.05;
        } else {
          tugPos.x += (-125 - tugPos.x) * 0.05;
          tugPos.y += (-65 - tugPos.y) * 0.05;
        }

        // Draw Tug
        const tugX = cx + tugPos.x;
        const tugY = cy + tugPos.y;
        
        ctx.save();
        ctx.translate(tugX, tugY);
        ctx.rotate(-0.4);
        
        // Tug body
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(-8, -6, 16, 12);
        ctx.fillStyle = '#8da9cb';
        ctx.fillRect(-20, -4, 10, 8); // Left arm
        ctx.fillRect(10, -4, 10, 8);  // Right arm
        
        // Engine glow
        if (state.current === GameState.APPROACH) {
          ctx.fillStyle = `rgba(85, 230, 255, ${0.5 + Math.random() * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(-8, -6);
          ctx.lineTo(-18, 0);
          ctx.lineTo(-8, 6);
          ctx.fill();
        }
        ctx.restore();

        // Tug Label
        ctx.fillStyle = '#ffd166';
        ctx.font = '11px system-ui';
        ctx.fillText('TUG-01', tugX - 20, tugY - 18);

        // Footer text
        if (state.view === 'altitude') {
          ctx.fillStyle = '#9db2cf';
          ctx.font = '12px system-ui';
          ctx.fillText('Altitude scale: 400–1,000 km', 24, h - 24);
        }

        // Render Particles
        state.particles.forEach((p, index) => {
          p.y -= 1;
          p.life -= 0.02;
          ctx.fillStyle = `rgba(112, 240, 177, ${p.life})`;
          ctx.font = 'bold 16px system-ui';
          ctx.fillText(p.text, p.x, p.y);
          if (p.life <= 0) state.particles.splice(index, 1);
        });

        requestAnimationFrame(draw);
      }

      // --- Game Logic ---
      
      function launchApproach() {
        const target = debris.find(d => d.id === state.selectedId);
        if (!target || target.cleared || state.fuel < target.fuelCost) return;

        state.current = GameState.APPROACH;
        state.fuel -= target.fuelCost;
        state.tugTarget = target;
        
        addLog(`Approach burn started for ${target.name}. Fuel -${target.fuelCost}%.`, 'warn');
        updateUI();

        setTimeout(() => {
          if (state.current !== GameState.APPROACH) return;
          
          // Navigation risk event
          if (Math.random() < 0.15 && state.nav < 60) {
            const dmg = 8;
            state.hull = Math.max(0, state.hull - dmg);
            addLog(`Minor navigation deviation! Hull -${dmg}%.`, 'bad');
            
            if (state.hull <= 0) return triggerGameOver(false, 'Hull integrity compromised.');
          } else {
            addLog(`Rendezvous established. Capture window ready.`, 'good');
          }

          state.current = GameState.CAPTURE;
          updateUI();
          startCaptureMiniGame(target);
          
        }, 1500);
      }

      let miniGameInterval = null;

      function startCaptureMiniGame(target) {
        const modal = $('modal-capture');
        $('capture-title').textContent = `Target: ${target.name}`;
        
        // Calculate window based on arm stat (60% arm = 0.06 width, 95% arm = 0.15 width)
        const halfWidth = 0.05 + (state.arm / 100) * 0.1;
        const leftBound = 0.5 - halfWidth;
        const rightBound = 0.5 + halfWidth;
        
        const zoneEl = $('capture-zone');
        const cursorEl = $('capture-cursor');
        const statusEl = $('capture-status');
        
        zoneEl.style.left = `${leftBound * 100}%`;
        zoneEl.style.width = `${(rightBound - leftBound) * 100}%`;

        modal.classList.add('show');

        let startTime = performance.now();
        let phase = Math.random() * Math.PI * 2;
        let currentPos = 0;

        miniGameInterval = setInterval(() => {
          if (state.current !== GameState.CAPTURE) return;
          
          const t = (performance.now() - startTime) / 1000;
          currentPos = (Math.sin(t * 3.5 + phase) + 1) / 2;
          
          cursorEl.style.left = `${currentPos * 100}%`;
          
          const inZone = currentPos > leftBound && currentPos < rightBound;
          statusEl.textContent = inZone ? 'WINDOW OPEN' : 'WAITING FOR ALIGNMENT';
          statusEl.style.color = inZone ? 'var(--green)' : 'var(--muted)';
        }, 16);

        // Set up fire button
        const fireBtn = $('fireBtn');
        const newFireBtn = fireBtn.cloneNode(true); // Remove old listeners
        fireBtn.parentNode.replaceChild(newFireBtn, fireBtn);
        
        newFireBtn.addEventListener('click', () => executeCapture(target, currentPos, halfWidth));
        newFireBtn.id = 'fireBtn'; // maintain id

        // Set up abort button
        const abortBtn = $('abortBtn');
        const newAbortBtn = abortBtn.cloneNode(true);
        abortBtn.parentNode.replaceChild(newAbortBtn, abortBtn);
        
        newAbortBtn.addEventListener('click', () => {
          clearInterval(miniGameInterval);
          state.current = GameState.PLANNING;
          state.tugTarget = null;
          modal.classList.remove('show');
          addLog('Approach aborted. Returning to planning phase.', 'warn');
          updateUI();
        });
        newAbortBtn.id = 'abortBtn';
      }

      function executeCapture(target, pos, halfWidth) {
        if (state.current !== GameState.CAPTURE) return;
        
        clearInterval(miniGameInterval);
        $('modal-capture').classList.remove('show');
        
        const success = Math.abs(pos - 0.5) < halfWidth;
        
        if (success) {
          target.cleared = true;
          state.credits += target.reward;
          state.reputation += 30;
          state.hull = Math.min(100, state.hull + 5);
          
          addLog(`Capture successful: ${target.name} secured. +${target.reward}cr, +30 Rep.`, 'good');
          showToast('Target secured!');
          
          // Spawn floating text
          state.particles.push({ x: target.x, y: target.y, text: `+${target.reward}cr`, life: 1.0 });
          
        } else {
          state.fuel = Math.max(0, state.fuel - 5);
          state.hull = Math.max(0, state.hull - 15);
          
          addLog(`Capture missed! Target remains in orbit. Hull -15%.`, 'bad');
          showToast('Capture Failed - Systems Damaged');
        }

        state.missionNum++;
        state.current = GameState.PLANNING;
        state.tugTarget = null;

        // Check win/loss
        if (debris.every(d => d.cleared)) {
          triggerGameOver(true, 'All targets cleared. Orbital environment secured.');
        } else if (state.hull <= 0 || state.fuel <= 0) {
          triggerGameOver(false, 'Spacecraft resources depleted. Mission failed.');
        } else {
          updateUI();
        }
      }

      function triggerGameOver(isWin, message) {
        state.current = GameState.GAMEOVER;
        state.tugTarget = null;
        updateUI();
        
        const modal = $('modal-gameover');
        $('go-title').textContent = isWin ? 'Mission Complete' : 'Mission Failed';
        $('go-title').style.color = isWin ? 'var(--green)' : 'var(--red)';
        $('go-desc').textContent = message;
        
        $('go-credits').textContent = state.credits;
        $('go-rep').textContent = state.reputation;
        $('go-hull').textContent = `${Math.round(state.hull)}%`;
        
        modal.classList.add('show');
      }

      // --- Event Listeners ---

      $('btn-launch').addEventListener('click', launchApproach);

      $('btn-upgrade').addEventListener('click', () => {
        if (state.credits < 60 || state.upgraded) return;
        state.credits -= 60;
        state.upgraded = true;
        state.nav = Math.min(100, state.nav + 15);
        state.arm = Math.min(95, state.arm + 25);
        addLog('Tug upgraded: Precision Navigation and improved Capture Arm.', 'good');
        showToast('Upgrade installed!');
        updateUI();
      });

      $('btn-refuel').addEventListener('click', () => {
        if (state.credits < 30 || state.fuel >= 100) return;
        state.credits -= 30;
        state.fuel = Math.min(100, state.fuel + 25);
        addLog('Refueling complete. +25% Fuel.', 'good');
        updateUI();
      });

      $('btn-restart').addEventListener('click', () => location.reload());

      // Tab Switching
      document.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          state.view = e.target.dataset.view;
        });
      });

      // Keyboard support for mini-game
      document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && state.current === GameState.CAPTURE) {
          e.preventDefault();
          $('fireBtn').click();
        }
      });

      // Canvas Click to Select Target
      canvas.addEventListener('click', (e) => {
        if (state.current !== GameState.PLANNING) return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        const clickedTarget = debris
          .filter(d => !d.cleared && d.x && d.y)
          .find(d => Math.hypot(d.x - clickX, d.y - clickY) < 25); // Click radius

        if (clickedTarget) {
          state.selectedId = clickedTarget.id;
          updateUI();
        }
      });

      // --- Initialization ---
      addLog('Mission control online. 5 simulated targets detected.', 'good');
      addLog('Select a target and launch an approach to begin.');
      updateUI();
      requestAnimationFrame(draw);

    })();
