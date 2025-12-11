// JavaScript Document - Aventura Sella (Versión Suave y Orgánica)

        const header = document.getElementById('header');
        const scrollToTopBtn = document.getElementById('scrollToTop');
        const menuToggle = document.getElementById('menuToggle');
        const mainMenu = document.getElementById('mainMenu');
        const menuItems = document.querySelectorAll('.main-menu .menu-item');
        
        // Incluye todas las IDs de las secciones
        const sections = document.querySelectorAll('.section');

        // 1. Mobile Menu Toggle
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            mainMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a menu item
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                // Pequeño timeout para que la navegación por URL ocurra primero
                setTimeout(() => {
                    menuToggle.classList.remove('active');
                    mainMenu.classList.remove('active');
                }, 100);
            });
        });

        // 2. Scroll Logic: Active Menu & ScrollToTop Button
        function updateActiveMenuItem() {
            let current = '';
            const scrollY = window.scrollY;

            // 1. Determinar la sección actual (con un pequeño offset para el header)
            sections.forEach(section => {
                const sectionTop = section.offsetTop - header.offsetHeight;
                
                if (scrollY >= sectionTop - 50) { 
                    current = section.getAttribute('id');
                }
            });

            // 2. Marcar el menú activo
            menuItems.forEach(item => {
                item.classList.remove('active');
                
                if (item.getAttribute('href').endsWith(`#${current}`)) {
                     item.classList.add('active');
                }
            });
            
            // 3. Mostrar/ocultar botón de Scroll to Top
            if (scrollY > 500) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        }

        window.addEventListener('scroll', updateActiveMenuItem);
        window.addEventListener('DOMContentLoaded', updateActiveMenuItem);

        // Scroll to top button action
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        
        // 3. Smooth Scroll para enlaces ancla (ajustando el offset del header)
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    // Ajuste para el header fijo
                    const offset = targetElement.offsetTop - header.offsetHeight; 
                    window.scrollTo({ top: offset, behavior: 'smooth' });
                }
            });
        });

        // 4. SCROLL REVEAL FUNCTIONALITY (Lógica de animación)
        function checkScrollReveal() {
            const reveals = document.querySelectorAll('.scroll-reveal');
            const viewportHeight = window.innerHeight;

            reveals.forEach(el => {
                const elementTop = el.getBoundingClientRect().top;
                
                // Activar cuando el elemento está visible en el 85% del viewport
                if (elementTop < viewportHeight * 0.85) { 
                    el.classList.add('visible');
                }
            });
        }

        // Inicializar y vincular eventos para Scroll Reveal
        window.addEventListener('scroll', checkScrollReveal);
        window.addEventListener('resize', checkScrollReveal);
        document.addEventListener('DOMContentLoaded', checkScrollReveal);
        window.addEventListener('load', checkScrollReveal);