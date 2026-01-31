document.addEventListener('DOMContentLoaded', function() {

    // 1. MENÚ MÓVIL
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const menuIcon = menuToggle.querySelector('i');

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

    // 2. GESTIÓN DE CITAS Y HORARIOS
    const citaForm = document.getElementById('citaForm');
    const modal = document.getElementById('modalConfirmacion');
    const closeBtn = document.querySelector('.close');
    const mensajeConfirmacion = document.getElementById('mensajeConfirmacion');
    const barberoSelect = document.getElementById('barbero');
    const fechaInput = document.getElementById('fecha');
    const horaSelect = document.getElementById('hora');

    const WHATSAPP_NUMBER = '523317562312';

    if(fechaInput) {
        const hoy = new Date().toISOString().split('T')[0];
        fechaInput.setAttribute('min', hoy);
    }

    // --- CONFIGURACIÓN DE HORARIOS ---
    function generarHoras(inicio, fin) {
        let horas = [];
        for (let i = inicio; i < fin; i++) {
            horas.push(`${i}:00`);
            horas.push(`${i}:30`);
        }
        // Agregamos la hora exacta de fin si es necesario, 
        // pero aquí 'fin' funciona como límite.
        // Si queremos incluir las 7:00 PM (19:00), el bucle llega hasta 19 y pone 19:00 y 19:30.
        // Filtraremos después si es necesario.
        return horas;
    }

    function obtenerCitas() {
        const citas = localStorage.getItem('citasBarberUrbana');
        return citas ? JSON.parse(citas) : [];
    }
    function guardarCita(cita) {
        const citas = obtenerCitas();
        citas.push(cita);
        localStorage.setItem('citasBarberUrbana', JSON.stringify(citas));
    }
    function verificarDisponibilidad(barbero, fecha, hora) {
        const citas = obtenerCitas();
        return !citas.some(c => c.barbero === barbero && c.fecha === fecha && c.hora === hora);
    }

    // --- LÓGICA PRINCIPAL DE HORARIOS ---
    function actualizarHorarios() {
        if(!barberoSelect || !fechaInput) return;
        if (!barberoSelect.value || !fechaInput.value) {
            horaSelect.disabled = true;
            horaSelect.innerHTML = '<option value="">Elige fecha y barbero</option>';
            return;
        }
        
        const barbero = barberoSelect.value;
        const fecha = fechaInput.value;
        const citas = obtenerCitas();
        const horariosOcupados = citas
            .filter(c => c.barbero === barbero && c.fecha === fecha)
            .map(c => c.hora);

        // Obtener día de la semana (0=Domingo, 1=Lunes...)
        const diaSemana = new Date(fecha + 'T00:00:00').getDay();
        
        let horariosDelDia = [];

        if (diaSemana === 0) {
            // DOMINGO: CERRADO
            // No generamos horas.
            horariosDelDia = [];
        } else {
            // LUNES A SÁBADO: 11:00 AM - 7:29 PM
            // Generamos de 11 a 20. Esto crea: 11:00...19:00, 19:30.
            // Filtraremos las 19:30 para que la última cita sea a las 7:00 PM.
            let horasBrutas = generarHoras(11, 20);
            
            // Eliminamos 19:30 para respetar el cierre a las 7:29/7:30
            horariosDelDia = horasBrutas.filter(h => h !== '19:30');
        }
        
        // Filtrar ocupados
        const horariosLibres = horariosDelDia.filter(h => !horariosOcupados.includes(h));
        
        horaSelect.disabled = false;
        
        // Mensajes según disponibilidad o si está cerrado
        if (diaSemana === 0) {
            horaSelect.innerHTML = '<option value="">⛔ CERRADO LOS DOMINGOS</option>';
            horaSelect.disabled = true;
        } else if (horariosLibres.length === 0) {
            horaSelect.innerHTML = '<option value="">Agenda llena este día</option>';
            horaSelect.disabled = true;
        } else {
            horaSelect.innerHTML = '<option value="">Selecciona hora</option>';
            horariosLibres.forEach(hora => {
                const option = document.createElement('option');
                option.value = hora;
                option.textContent = formatearHora(hora);
                horaSelect.appendChild(option);
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

    // 3. ENVÍO FORMULARIO
    if(citaForm) {
        citaForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                nombre: document.getElementById('nombre').value,
                telefono: document.getElementById('telefono').value,
                barbero: barberoSelect.value,
                servicio: document.getElementById('servicio').value,
                fecha: fechaInput.value,
                hora: horaSelect.value,
                notas: document.getElementById('notas').value
            };
            
            if (formData.telefono.length < 10) {
                mostrarToast('El teléfono debe tener 10 dígitos', 'error'); return;
            }

            // Validación extra por si acaso alguien inspecciona elemento y habilita el domingo
            const diaSemana = new Date(formData.fecha + 'T00:00:00').getDay();
            if (diaSemana === 0) {
                mostrarToast('Lo sentimos, los domingos estamos cerrados.', 'error');
                return;
            }
            
            if (!verificarDisponibilidad(formData.barbero, formData.fecha, formData.hora)) {
                mostrarToast('Ese horario ya fue ocupado, intenta otro.', 'error');
                actualizarHorarios();
                return;
            }
            
            const btnSubmit = document.querySelector('.btn-submit');
            const textoOriginal = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Confirmando...';
            btnSubmit.disabled = true;
            
            try {
                guardarCita(formData);
                mostrarModalConfirmacion(formData);
                mostrarToast('¡Cita apartada! Abriendo WhatsApp...', 'success');
                
                setTimeout(() => {
                    const mensaje = crearMensajeWA(formData);
                    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`, '_blank');
                    
                    setTimeout(() => {
                        modal.style.display = 'none';
                        citaForm.reset();
                        actualizarHorarios();
                        btnSubmit.innerHTML = textoOriginal;
                        btnSubmit.disabled = false;
                    }, 1000);
                }, 2000);
                
            } catch (error) {
                mostrarToast('Error al procesar.', 'error');
                btnSubmit.disabled = false;
            }
        });
    }

    function crearMensajeWA(data) {
        const fechaLegible = new Date(data.fecha + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
        return `💈 *NUEVA CITA - BARBERÍA SAMUEL* 💈\n\n` +
               `👤 Cliente: *${data.nombre}*\n` +
               `📱 Tel: ${data.telefono}\n\n` +
               `🔥 *Servicio:* ${data.servicio}\n` +
               `✂️ *Barbero:* ${data.barbero}\n` +
               `📅 *Fecha:* ${fechaLegible}\n` +
               `⏰ *Hora:* ${formatearHora(data.hora)}\n\n` +
               `📝 *Notas:* ${data.notas || 'N/A'}`;
    }

    // 4. UTILIDADES UI
    function mostrarToast(mensaje, tipo = 'success') {
        const container = document.getElementById('toast-container');
        if(!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        toast.innerHTML = `<i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i><span>${mensaje}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'fadeOutRight 0.5s forwards';
            setTimeout(() => toast.remove(), 500);
        }, 3500);
    }

    function mostrarModalConfirmacion(data) {
        mensajeConfirmacion.innerHTML = `Jefe <strong>${data.nombre}</strong>, tu lugar está apartado.<br>Confirma los detalles en el chat con ${data.barbero}.`;
        modal.style.display = 'block';
    }
    if(closeBtn) closeBtn.onclick = () => modal.style.display = 'none';

    // Animaciones Scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.servicio-card, .galeria-item, .info-card').forEach(el => {
        el.style.opacity = '0'; el.style.transform = 'translateY(30px)'; el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
    
    // Solo números
    const telInput = document.getElementById('telefono');
    if(telInput) telInput.addEventListener('input', function(e) { this.value = this.value.replace(/[^0-9]/g, ''); });
});
