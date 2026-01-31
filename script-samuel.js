document.addEventListener('DOMContentLoaded', function() {
    const WHATSAPP_NUMBER = '523317562312'; 
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const menuIcon = menuToggle ? menuToggle.querySelector('i') : null;
    const citaForm = document.getElementById('citaForm');
    const modal = document.getElementById('modalConfirmacion');
    const closeBtn = document.querySelector('.close');
    const mensajeConfirmacion = document.getElementById('mensajeConfirmacion');
    const barberoSelect = document.getElementById('barbero');
    const fechaInput = document.getElementById('fecha');
    const horaSelect = document.getElementById('hora');

    if(menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            if (navLinks.classList.contains('active')) {
                menuIcon.classList.remove('fa-bars');
                menuIcon.classList.add('fa-times');
            } else {
                menuIcon.classList.remove('fa-times');
                menuIcon.classList.add('fa-bars');
            }
        });
    }

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            if(menuIcon) {
                menuIcon.classList.remove('fa-times');
                menuIcon.classList.add('fa-bars');
            }
        });
    });

    if(fechaInput) {
        const hoy = new Date().toISOString().split('T')[0];
        fechaInput.setAttribute('min', hoy);
    }

    function generarHoras(inicio, fin) {
        let horas = [];
        for (let i = inicio; i < fin; i++) {
            horas.push(`${i}:00`);
            horas.push(`${i}:30`);
        }
        return horas;
    }

    function actualizarHorarios() {
        if(!barberoSelect || !fechaInput) return;
        
        if (!barberoSelect.value || !fechaInput.value) {
            horaSelect.disabled = true;
            horaSelect.innerHTML = '<option value="">ELIGE FECHA PRIMERO</option>';
            return;
        }

        const fecha = fechaInput.value;
        const diaSemana = new Date(fecha + 'T00:00:00').getDay();
        
        horaSelect.innerHTML = ''; 
        horaSelect.disabled = false;

        if (diaSemana === 0) { 
            horaSelect.innerHTML = '<option value="">CERRADO (DOMINGO)</option>';
            horaSelect.disabled = true;
        } else {
            horaSelect.innerHTML = '<option value="">HORA DISPONIBLE</option>';
            const horasDisponibles = generarHoras(11, 20); 
            
            horasDisponibles.forEach(hora => {
                if(hora !== '19:30') { 
                     const option = document.createElement('option');
                     option.value = hora;
                     option.textContent = formatearHora(hora);
                     horaSelect.appendChild(option);
                }
            });
        }
    }

    function formatearHora(hora) {
        const [h, m] = hora.split(':');
        const hNum = parseInt(h);
        const periodo = hNum >= 12 ? 'PM' : 'AM';
        const h12 = hNum > 12 ? hNum - 12 : (hNum === 0 ? 12 : hNum);
        return `${h12}:${m} ${periodo}`;
    }

    if(barberoSelect && fechaInput) {
        barberoSelect.addEventListener('change', actualizarHorarios);
        fechaInput.addEventListener('change', actualizarHorarios);
    }

    if(citaForm) {
        citaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nombre = document.getElementById('nombre').value;
            const telefono = document.getElementById('telefono').value;
            const barbero = barberoSelect.value;
            const servicio = document.getElementById('servicio').value;
            const fecha = fechaInput.value;
            const hora = horaSelect.value;
            const notas = document.getElementById('notas').value;

            if (telefono.length < 10) {
                mostrarToast('CELULAR INVÁLIDO (10 DÍGITOS)', 'error'); return;
            }

            const btnSubmit = document.querySelector('.btn-submit');
            btnSubmit.innerHTML = 'PROCESANDO...';
            btnSubmit.disabled = true;

            setTimeout(() => {
                mensajeConfirmacion.innerHTML = `QUE TAL <strong>${nombre}</strong>, VAMOS A CONFIRMAR AL WHATSAPP.`;
                modal.style.display = 'block';
                mostrarToast('ABRIENDO WHATSAPP...', 'success');

                const fechaLegible = new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
                const mensaje = `💈 *CITA NUEVA - SAMUEL* 💈\n` +
                                `--------------------------\n` +
                                `👤 CLIENTE: *${nombre}*\n` +
                                `📱 TEL: ${telefono}\n` +
                                `🔥 CORTE: *${servicio}*\n` +
                                `✂️ BARBERO: ${barbero}\n` +
                                `📅 FECHA: ${fechaLegible}\n` +
                                `⏰ HORA: ${formatearHora(hora)}\n\n` +
                                `📝 NOTA: ${notas}`;
                
                const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;

                setTimeout(() => {
                    window.open(url, '_blank');
                    btnSubmit.innerHTML = 'CONFIRMAR CITA';
                    btnSubmit.disabled = false;
                    citaForm.reset();
                    modal.style.display = 'none';
                    actualizarHorarios();
                }, 1500);

            }, 1000);
        });
    }

    function mostrarToast(mensaje, tipo) {
        const container = document.getElementById('toast-container');
        if(!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        toast.innerHTML = `<i class="fas ${tipo === 'success' ? 'fa-check-square' : 'fa-exclamation-triangle'}"></i><span>${mensaje}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'fadeOutRight 0.5s forwards';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    if(closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if(e.target == modal) modal.style.display = 'none'; }
    const telInput = document.getElementById('telefono');
    if(telInput) telInput.addEventListener('input', function(e) { this.value = this.value.replace(/[^0-9]/g, ''); });
});
