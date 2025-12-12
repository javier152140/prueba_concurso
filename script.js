document.addEventListener('DOMContentLoaded', () => {
    
    // =======================================
    // 1. UTILIDADES Y LOCALSTORAGE
    // =======================================
    
    const LOCAL_STORAGE_KEY = 'aventuraSellaCart';

    const loadCart = () => {
        const storedCart = localStorage.getItem(LOCAL_STORAGE_KEY);
        const cart = storedCart ? JSON.parse(storedCart) : [];
        return cart.map(item => ({
            name: item.name,
            price: item.price,
            participants: item.participants && item.participants > 0 ? item.participants : 1
        }));
    };

    const saveCart = (cart) => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cart));
    };
    
    let cart = loadCart();

    // =======================================
    // 2. ELEMENTOS DEL DOM Y VALIDACIÓN
    // =======================================
    
    const cartItemsContainer = document.querySelector('.cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const taxEl = document.getElementById('cart-tax');
    const totalEl = document.getElementById('cart-total');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const checkoutBtn = document.getElementById('checkout-btn');
    const participantsGlobalInput = document.getElementById('participants-global'); 
    const requiredInputs = document.querySelectorAll('#booking-form input[required], .contact-info input[required], #booking-form select[required]');

    const activitiesGrid = document.querySelector('.activities-grid');

    const menuToggle = document.querySelector('.menu-toggle'); 
    const mainMenu = document.querySelector('.main-menu');      
    const scrollToTopBtn = document.querySelector('.scroll-to-top'); 


    let isSyncing = false; 

    const getGlobalParticipants = () => {
        return cart.length > 0 ? cart[0].participants : 1;
    };
    
    const checkFormValidity = () => {
        if (!checkoutBtn) return; 

        let isFormValid = true;
        
        requiredInputs.forEach(input => {
            if (!input.value || (input.tagName === 'SELECT' && input.value === "")) {
                isFormValid = false;
            }
        });
        
        const isCartNotEmpty = cart.length > 0;
        const hasValidParticipants = cart.every(item => item.participants >= 1);
        
        checkoutBtn.disabled = !(isFormValid && isCartNotEmpty && hasValidParticipants);
    };
    
    // =======================================
    // 3. RENDERIZACIÓN DE LA VISTA DEL CARRITO
    // =======================================
    
    const renderCart = () => {
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = '';
            let subtotal = 0;

            if (cart.length === 0) {
                if (emptyCartMessage) emptyCartMessage.style.display = 'block';
                if (participantsGlobalInput) participantsGlobalInput.value = 1;
            } else {
                if (emptyCartMessage) emptyCartMessage.style.display = 'none';
            }

            cart.forEach((item, index) => {
                const itemTotal = item.price * item.participants; 
                subtotal += itemTotal;

                const cartItemEl = document.createElement('div');
                cartItemEl.classList.add('cart-item');
                
                cartItemEl.innerHTML = `
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <p>Precio/persona: ${item.price.toFixed(2)}€</p>
                    </div>
                    <div class="item-controls">
                        <label>Personas:</label>
                        <input type="number" 
                                min="1" 
                                value="${item.participants}" 
                                data-index="${index}"
                                class="participants-input"
                                style="width: 60px; text-align: center; margin: 0 10px;">
                        <span class="item-price">${itemTotal.toFixed(2)}€</span>
                        <button class="remove-btn" data-index="${index}"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItemEl);
            });

            const taxRate = 0.21;
            const tax = subtotal * taxRate;
            const total = subtotal + tax;

            if (subtotalEl) subtotalEl.textContent = `${subtotal.toFixed(2)}€`;
            if (taxEl) taxEl.textContent = `${tax.toFixed(2)}€`;
            if (totalEl) totalEl.textContent = `${total.toFixed(2)}€`;
        }
        
        checkFormValidity();
        updateSelectionButtons(); // <--- Aquí se llama al actualizador
        saveCart(cart);
    };


    // =======================================
    // 4. FUNCIONES DE SINCRONIZACIÓN
    // =======================================

    const syncGlobalToItems = () => {
        if (isSyncing || cart.length === 0 || !participantsGlobalInput) return;
        isSyncing = true;
        
        let newParticipants = parseInt(participantsGlobalInput.value);
        if (isNaN(newParticipants) || newParticipants < 1) {
            newParticipants = 1;
            participantsGlobalInput.value = 1;
        }

        cart = cart.map(item => ({
            ...item,
            participants: newParticipants
        }));

        renderCart();
        isSyncing = false;
    };
    
    const syncItemToGlobal = (index, newParticipants) => {
        if (isSyncing) return;
        isSyncing = true;
        
        cart[index].participants = newParticipants;
        
        if (participantsGlobalInput && cart.length > 0) {
            participantsGlobalInput.value = newParticipants;
        }

        renderCart();
        isSyncing = false;
    };


    // =======================================
    // 5. LÓGICA DE INTERACCIÓN (index.html) - ¡CORREGIDO!
    // =======================================

    const updateSelectionButtons = () => {
        if (!activitiesGrid) return; 

        document.querySelectorAll('.activity-card').forEach(card => {
            const name = card.dataset.name || card.querySelector('h3').textContent.trim();
            const button = card.querySelector('.add-to-cart-btn');
            const isInCart = cart.some(item => item.name === name);

            if (isInCart) {
                // Si está en el carrito, debe tener la clase 'selected' y el texto 'Actividad Seleccionada'
                button.textContent = 'ACTIVIDAD SELECCIONADA';
                card.classList.add('selected'); // Se añade la clase a la tarjeta, no al botón
            } else {
                // Si NO está en el carrito
                button.textContent = 'Seleccionar Actividad';
                card.classList.remove('selected');
            }
        });
    };

    if (activitiesGrid) {
        activitiesGrid.addEventListener('click', (e) => {
            const button = e.target.closest('.add-to-cart-btn');
            if (!button) return;

            // Se detiene la propagación del evento para evitar problemas
            e.preventDefault();

            const card = button.closest('.activity-card');
            
            // 1. Obtener el nombre
            const name = card.dataset.name || card.querySelector('h3').textContent.trim();
            
            // 2. Obtener el precio de forma ROBUSTA
            let price = parseFloat(card.dataset.price);
            
            if (isNaN(price) || price <= 0) {
                 // Fallback de seguridad (Si data-price falla, intenta leer el div.price)
                 const priceTextEl = card.querySelector('.price'); 
                 if (priceTextEl) {
                    const priceMatch = priceTextEl.textContent.match(/^\s*(\d+)/); 
                    if (priceMatch && priceMatch[1]) {
                        price = parseFloat(priceMatch[1]);
                    }
                 }
                 if (isNaN(price) || price <= 0) {
                    console.error("ERROR: No se pudo determinar el precio de la actividad.");
                    return;
                 }
            }
            
            const existingItemIndex = cart.findIndex(item => item.name === name);
            
            const initialParticipants = getGlobalParticipants();

            if (existingItemIndex === -1) {
                // Si no está: Añadir al carrito
                cart.push({ name, price, participants: initialParticipants });
            } else {
                // Si ya está: Quitar del carrito
                cart.splice(existingItemIndex, 1);
            }
            
            // Sincronizar participantes globales (si aplica)
            if (participantsGlobalInput) {
                participantsGlobalInput.value = getGlobalParticipants();
            }

            renderCart(); // Vuelve a dibujar el carrito y los botones
        });
    }

    // =======================================
    // 6. LÓGICA DE INTERACCIÓN (contacto.html)
    // =======================================
    
    const initContactPage = () => {
        if (cartItemsContainer) {
            
            // *** 1. SINCRONIZACIÓN INICIAL AL CARGAR ***
            if (participantsGlobalInput) {
                participantsGlobalInput.value = getGlobalParticipants();
                syncGlobalToItems();
            }
            
            // *** 2. LISTENERS ***
            if (participantsGlobalInput) {
                participantsGlobalInput.addEventListener('change', syncGlobalToItems);
                participantsGlobalInput.addEventListener('input', syncGlobalToItems);
            }

            cartItemsContainer.addEventListener('input', (e) => {
                const input = e.target;
                if (input.classList.contains('participants-input')) {
                    const index = parseInt(input.dataset.index);
                    let newParticipants = parseInt(input.value);

                    if (isNaN(newParticipants) || newParticipants < 1) {
                        newParticipants = 1;
                        input.value = 1;
                    }
                    
                    syncItemToGlobal(index, newParticipants); 
                }
            });
            
            cartItemsContainer.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('.remove-btn');
                if (!removeBtn) return;
                
                const index = parseInt(removeBtn.dataset.index);
                cart.splice(index, 1);
                
                if (participantsGlobalInput) {
                    participantsGlobalInput.value = cart.length > 0 ? cart[0].participants : 1;
                }

                renderCart();
            });


            requiredInputs.forEach(input => {
                input.addEventListener('input', checkFormValidity);
            });

            if (checkoutBtn) {
                checkoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (!checkoutBtn.disabled) { 
                        const form = document.getElementById('booking-form');
                        if (form.checkValidity()) {
                            document.getElementById('booking-form-container').style.display = 'none'; 
                            document.querySelector('.cart-summary').style.display = 'none'; 
                            document.getElementById('confirmation-stage').classList.remove('hidden');
                            
                            cart.length = 0;
                            saveCart(cart); 
                        } else {
                             form.reportValidity(); 
                           }
                    }
                });
            }
        }
    }


    // =======================================
    // 7. SCROLL REVEAL Y NAVEGACIÓN
    // =======================================

    // Función de Scroll Reveal original (usada en tu script)
    const scrollReveal = () => {
        const reveals = document.querySelectorAll('.scroll-reveal');
        for (let i = 0; i < reveals.length; i++) {
            const windowHeight = window.innerHeight;
            const revealTop = reveals[i].getBoundingClientRect().top;
            const revealPoint = 150; 

            if (revealTop < windowHeight - revealPoint) {
                reveals[i].classList.add('visible');
            }
        }
    };
    window.addEventListener('scroll', scrollReveal);
    scrollReveal(); 


    if (menuToggle && mainMenu) {
        menuToggle.addEventListener('click', () => {
            mainMenu.classList.toggle('open');
            menuToggle.classList.toggle('is-open'); 
        });
        
        mainMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (mainMenu.classList.contains('open') && window.innerWidth <= 768) {
                    mainMenu.classList.remove('open');
                    menuToggle.classList.remove('is-open');
                }
            });
        });
    }
    
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollToTopBtn.classList.add('visible'); 
            } else {
                scrollToTopBtn.classList.remove('visible'); 
            }
        });

        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // =======================================
    // 8. INICIALIZACIÓN
    // =======================================
    
    renderCart();

    if (window.location.pathname.endsWith('contacto.html')) {
        initContactPage();
    }
});