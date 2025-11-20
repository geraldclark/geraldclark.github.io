// ============================================
// Portfolio Dashboard Application
// Consolidated JavaScript with namespaced functionality
// ============================================

const app = (function() {
    'use strict';

    // Portfolio Data
    let portfolioData = null;

    // ============================================
    // UTILITIES
    // ============================================
    const utils = {
        // Update current time
        updateTime() {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const dateString = now.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            const timeElement = document.getElementById('current-time');
            if (timeElement) {
                timeElement.textContent = `${dateString} ${timeString}`;
            }
        },

        // Animate stat counters
        animateCounter(element, target, duration = 2000) {
            const start = 0;
            const increment = target / (duration / 16);
            let current = start;
            const isDecimal = typeof target === 'number' && target % 1 !== 0;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    element.textContent = isDecimal ? target.toFixed(1) : target;
                    clearInterval(timer);
                } else {
                    element.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);
                }
            }, 16);
        },

        // Typing effect
        typeWriter(element, text, speed = 50) {
            let i = 0;
            element.textContent = '';
            
            function type() {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                }
            }
            
            type();
        },

        // Update footer stats with slight variations to simulate real-time monitoring
        updateFooterStats() {
            const footerStats = document.querySelector('.footer-stats');
            if (!footerStats) return;
            
            // Get only direct child spans (not nested ones)
            const statSpans = Array.from(footerStats.children).filter(child => child.tagName === 'SPAN');
            
            if (statSpans.length >= 3) {
                // CPU: vary between 8% and 16%
                const cpuElement = statSpans[0].querySelector('.stat-value-small');
                if (cpuElement) {
                    const cpuBase = 12;
                    const cpuVariation = (Math.random() * 8) - 4; // -4 to +4
                    const cpuValue = Math.max(0, Math.min(100, cpuBase + cpuVariation));
                    cpuElement.textContent = cpuValue.toFixed(0) + '%';
                }
                
                // RAM: vary between 40% and 50%
                const ramElement = statSpans[1].querySelector('.stat-value-small');
                if (ramElement) {
                    const ramBase = 45;
                    const ramVariation = (Math.random() * 10) - 5; // -5 to +5
                    const ramValue = Math.max(0, Math.min(100, ramBase + ramVariation));
                    ramElement.textContent = ramValue.toFixed(0) + '%';
                }
                
                // NET: vary between 1.8MB/s and 2.8MB/s
                const netElement = statSpans[2].querySelector('.stat-value-small');
                if (netElement) {
                    const netBase = 2.3;
                    const netVariation = (Math.random() * 1.0) - 0.5; // -0.5 to +0.5
                    const netValue = Math.max(0, netBase + netVariation);
                    netElement.textContent = netValue.toFixed(1) + 'MB/s';
                }
            }
        }
    };

    // ============================================
    // ANIMATIONS
    // ============================================
    const animations = {
        // Initialize stat counters
        initCounters() {
            const statValues = document.querySelectorAll('.stat-value[data-target]');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                        const targetValue = entry.target.getAttribute('data-target');
                        const isYearsExperience = entry.target.closest('.stat-card')?.getAttribute('data-card-id') === 'stat-2';
                        const target = isYearsExperience ? parseFloat(targetValue) : parseInt(targetValue);
                        app.utils.animateCounter(entry.target, target);
                        entry.target.classList.add('animated');
                    }
                });
            }, {
                threshold: 0.5
            });
            
            statValues.forEach(stat => {
                observer.observe(stat);
            });
        },

        // Animate skill bars on scroll - REMOVED: Skills now use YAML format, not progress bars
        // initSkillBars() {
        //     const skillBars = document.querySelectorAll('.skill-progress');
        //     
        //     const observer = new IntersectionObserver((entries) => {
        //         entries.forEach(entry => {
        //             if (entry.isIntersecting) {
        //                 const width = entry.target.style.width;
        //                 entry.target.style.width = '0%';
        //                 setTimeout(() => {
        //                     entry.target.style.width = width;
        //                 }, 100);
        //                 observer.unobserve(entry.target);
        //             }
        //         });
        //     }, {
        //         threshold: 0.5
        //     });
        //     
        //     skillBars.forEach(bar => {
        //         observer.observe(bar);
        //     });
        // }
    };

    // ============================================
    // NAVIGATION
    // ============================================
    const navigation = {
        // Flag to prevent updateActiveNav from overriding manual active state
        skipActiveUpdate: false,
        
        init() {
            const navLinks = document.querySelectorAll('.nav-link');
            const sections = document.querySelectorAll('section[id]');
            const heroSection = document.querySelector('.hero-section');
            
            // Restore saved nav order
            this.restoreNavOrder();
            
            // Make nav links draggable (desktop only)
            if (window.innerWidth > 768) {
                this.initDragAndDrop();
            }
            
            // Initialize mobile menu
            this.initMobileMenu();
            
            // Smooth scroll behavior
            navLinks.forEach(link => {
                link.addEventListener('click', function (e) {
                    // Don't navigate if this was a drag operation
                    if (this.wasDragging || this.classList.contains('dragging')) {
                        this.wasDragging = false;
                        return;
                    }
                    
                    // Don't navigate if clicking on close button
                    if (e.target.closest('.nav-close-btn')) {
                        return;
                    }
                    
                    e.preventDefault();
                    const targetId = this.getAttribute('href').substring(1);
                    const sectionId = this.getAttribute('data-section');
                    
                    // Handle top/terminal link - scroll to hero section's actual position
                    if (targetId === 'top' || sectionId === 'top') {
                        const heroSection = document.querySelector('.hero-section');
                        if (heroSection) {
                            const offset = 96; // Account for fixed status bar with tabs
                            const targetPosition = heroSection.getBoundingClientRect().top + window.pageYOffset - offset;
                            window.scrollTo({
                                top: targetPosition,
                                behavior: 'smooth'
                            });
                        } else {
                            // Fallback to top if hero section not found
                            window.scrollTo({
                                top: 0,
                                behavior: 'smooth'
                            });
                        }
                        return;
                    }
                    
                    // Handle dashboard link - scroll to projects completed stat card
                    if (targetId === 'dashboard' || this.getAttribute('data-section') === 'dashboard') {
                        // Set dashboard as active immediately
                        navLinks.forEach(link => {
                            link.classList.remove('active');
                            if (link.getAttribute('data-section') === 'dashboard') {
                                link.classList.add('active');
                            }
                        });
                        
                        const projectsCompletedCard = document.querySelector('[data-card-id="stat-1"]');
                        if (projectsCompletedCard) {
                            const offset = 96; // Account for fixed status bar with tabs
                            const targetPosition = projectsCompletedCard.getBoundingClientRect().top + window.pageYOffset - offset;
                            window.scrollTo({
                                top: targetPosition,
                                behavior: 'smooth'
                            });
                            return;
                        }
                    }
                    
                    const target = document.getElementById(targetId);
                    if (target) {
                        const offset = 96; // Account for fixed status bar with tabs
                        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                        
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                });
            });
            
            // Update active nav link on scroll
            window.addEventListener('scroll', () => {
                // Skip update if we just set it manually (e.g., after drag)
                if (!navigation.skipActiveUpdate) {
                    navigation.updateActiveNav();
                }
            });
            
            // Initial update
            navigation.updateActiveNav();
        },

        initDragAndDrop() {
            const navTabs = document.querySelector('.status-nav-tabs');
            if (!navTabs) {
                console.warn('Nav tabs container not found');
                return;
            }

            const navLinks = Array.from(navTabs.querySelectorAll('.nav-link'));
            if (navLinks.length === 0) {
                console.warn('No nav links found');
                return;
            }

            let draggedElement = null;
            let isDragging = false;
            let dragStartX = 0;
            let dragStartY = 0;
            let dropIndicator = null;
            
            // Create drop indicator element
            dropIndicator = document.createElement('div');
            dropIndicator.className = 'nav-drop-indicator';
            dropIndicator.style.cssText = 'position: absolute; height: 30px; width: 3px; background: var(--accent-orange); pointer-events: none; z-index: 1001; display: none;';
            document.body.appendChild(dropIndicator);

            // Add dragover handler to the container for better drop zone detection
            navTabs.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                const dragging = document.querySelector('.nav-link.dragging');
                if (!dragging) return;
                
                // Remove all drop indicators
                navTabs.querySelectorAll('.nav-link').forEach(navLink => {
                    navLink.classList.remove('drag-over', 'drag-before', 'drag-after');
                });
                
                // Get the position where we should insert
                const afterElement = this.getDragAfterElement(navTabs, e.clientX);
                
                // Show drop indicator line
                if (dropIndicator) {
                    let indicatorX = 0;
                    let indicatorY = 0;
                    
                    if (afterElement == null) {
                        // Will be inserted at the end
                        const lastLink = navTabs.querySelector('.nav-link:last-of-type:not(.dragging)');
                        if (lastLink) {
                            const rect = lastLink.getBoundingClientRect();
                            indicatorX = rect.right;
                            indicatorY = rect.top;
                            lastLink.classList.add('drag-after');
                        }
                    } else {
                        // Will be inserted before this element
                        const rect = afterElement.getBoundingClientRect();
                        indicatorX = rect.left;
                        indicatorY = rect.top;
                        afterElement.classList.add('drag-before');
                    }
                    
                    if (indicatorX > 0) {
                        dropIndicator.style.left = indicatorX + 'px';
                        dropIndicator.style.top = indicatorY + 'px';
                        dropIndicator.style.display = 'block';
                    }
                }
                
                // Update DOM position (but don't reorder content yet)
                if (afterElement == null) {
                    navTabs.appendChild(dragging);
                } else {
                    navTabs.insertBefore(dragging, afterElement);
                }
            });
            
            navTabs.addEventListener('dragleave', (e) => {
                // Only hide indicator if we're leaving the container entirely
                if (!navTabs.contains(e.relatedTarget)) {
                    if (dropIndicator) {
                        dropIndicator.style.display = 'none';
                    }
                    navTabs.querySelectorAll('.nav-link').forEach(navLink => {
                        navLink.classList.remove('drag-over', 'drag-before', 'drag-after');
                    });
                }
            });

            navLinks.forEach((link, index) => {
                link.setAttribute('draggable', 'true');
                link.style.cursor = 'grab';
                link.style.userSelect = 'none';

                // Track mouse down to distinguish between click and drag
                link.addEventListener('mousedown', (e) => {
                    // Don't start drag if clicking on close button
                    if (e.target.closest('.nav-close-btn')) {
                        return;
                    }
                    dragStartX = e.clientX;
                    dragStartY = e.clientY;
                    isDragging = false;
                });

                link.addEventListener('dragstart', (e) => {
                    // Don't start drag if clicking on close button
                    if (e.target.closest('.nav-close-btn')) {
                        e.preventDefault();
                        return false;
                    }
                    
                    isDragging = true;
                    draggedElement = link;
                    link.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/html', link.outerHTML);
                });

                link.addEventListener('dragend', (e) => {
                    isDragging = false;
                    link.classList.remove('dragging');
                    // Remove all drag-related classes
                    document.querySelectorAll('.nav-link').forEach(el => {
                        el.classList.remove('drag-over', 'drag-before', 'drag-after');
                    });
                    // Hide drop indicator
                    if (dropIndicator) {
                        dropIndicator.style.display = 'none';
                    }
                    
                    // Reorder content sections after drag is complete
                    this.reorderContentSections();
                    
                    // Save new order
                    this.saveNavOrder();
                    
                    // Set the dragged tab as active
                    if (draggedElement) {
                        // Prevent scroll-based active nav updates temporarily
                        navigation.skipActiveUpdate = true;
                        
                        // Remove active class from all nav links
                        document.querySelectorAll('.nav-link').forEach(navLink => {
                            navLink.classList.remove('active');
                        });
                        
                        // Add active class to the dragged element
                        draggedElement.classList.add('active');
                        
                        // Scroll to the corresponding section
                        const sectionId = draggedElement.getAttribute('data-section');
                        if (sectionId === 'top') {
                            // Scroll to hero section's actual position
                            const heroSection = document.querySelector('.hero-section');
                            if (heroSection) {
                                const offset = 96;
                                const targetPosition = heroSection.getBoundingClientRect().top + window.pageYOffset - offset;
                                window.scrollTo({
                                    top: targetPosition,
                                    behavior: 'smooth'
                                });
                            } else {
                                window.scrollTo({
                                    top: 0,
                                    behavior: 'smooth'
                                });
                            }
                        } else if (sectionId === 'dashboard') {
                            const projectsCompletedCard = document.querySelector('[data-card-id="stat-1"]');
                            if (projectsCompletedCard) {
                                const offset = 96;
                                const targetPosition = projectsCompletedCard.getBoundingClientRect().top + window.pageYOffset - offset;
                                window.scrollTo({
                                    top: targetPosition,
                                    behavior: 'smooth'
                                });
                            }
                        } else {
                            const target = document.getElementById(sectionId);
                            if (target) {
                                const offset = 96;
                                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                                window.scrollTo({
                                    top: targetPosition,
                                    behavior: 'smooth'
                                });
                            }
                        }
                        
                        // Re-enable scroll-based updates after scroll completes
                        setTimeout(() => {
                            navigation.skipActiveUpdate = false;
                        }, 1000); // Wait for smooth scroll to complete
                    }
                    
                    // Mark that we were dragging to prevent click event
                    if (draggedElement) {
                        draggedElement.wasDragging = true;
                        setTimeout(() => {
                            if (draggedElement) {
                                draggedElement.wasDragging = false;
                            }
                        }, 100);
                    }
                });

                // Individual link dragover is now handled at container level for better precision

                link.addEventListener('dragenter', (e) => {
                    e.preventDefault();
                    if (link !== draggedElement) {
                        // Visual feedback handled in dragover
                    }
                });

                link.addEventListener('dragleave', (e) => {
                    // Only remove if we're actually leaving the element (not just moving to a child)
                    if (!link.contains(e.relatedTarget)) {
                        link.classList.remove('drag-over', 'drag-before', 'drag-after');
                    }
                });

                link.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Remove all drag-related classes
                    document.querySelectorAll('.nav-link').forEach(el => {
                        el.classList.remove('drag-over', 'drag-before', 'drag-after');
                    });
                    // Hide drop indicator
                    if (dropIndicator) {
                        dropIndicator.style.display = 'none';
                    }
                    
                    if (draggedElement && draggedElement !== link) {
                        const parent = link.parentElement;
                        if (draggedElement.nextSibling === link) {
                            parent.insertBefore(link, draggedElement);
                        } else {
                            parent.insertBefore(draggedElement, link);
                        }
                    }
                });
            });
        },

        getDragAfterElement(container, x) {
            const draggableElements = [...container.querySelectorAll('.nav-link:not(.dragging)')];
            
            if (draggableElements.length === 0) return null;
            
            // Find the element we're closest to
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                // Use the middle point of the element as the decision point
                const middle = box.left + box.width / 2;
                const offset = x - middle;
                
                // If we're to the left of this element's middle, and closer than previous
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        },

        reorderContentSections() {
            const navTabs = document.querySelector('.status-nav-tabs');
            if (!navTabs) return;

            const navLinks = Array.from(navTabs.querySelectorAll('.nav-link'));
            const dashboard = document.querySelector('.dashboard');
            if (!dashboard) return;

            // Get all sections and create a map
            const sectionMap = new Map();
            
            // Hero section (top) - this is a section element with class "hero-section"
            const heroSection = document.querySelector('.hero-section');
            if (heroSection) {
                sectionMap.set('top', heroSection);
            }
            
            // Stats grid (dashboard) - this is a section element with class "stats-grid" and data-section="stats"
            const statsGrid = document.querySelector('.stats-grid[data-section="stats"]');
            if (statsGrid) {
                sectionMap.set('dashboard', statsGrid);
            }
            
            // Content sections with IDs - these are section elements with IDs
            const contentSections = ['about', 'projects', 'skills', 'distinctions', 'contact'];
            contentSections.forEach(sectionId => {
                const section = document.getElementById(sectionId);
                if (section) {
                    sectionMap.set(sectionId, section);
                }
            });

            // Get all current children of dashboard (these are the sections we want to reorder)
            const allChildren = Array.from(dashboard.children);
            
            // Build ordered list based on nav link order
            const orderedSections = [];
            navLinks.forEach(navLink => {
                const sectionId = navLink.getAttribute('data-section');
                const sectionElement = sectionMap.get(sectionId);
                
                // Check if this section exists and is a direct child of dashboard
                if (sectionElement && allChildren.includes(sectionElement)) {
                    orderedSections.push(sectionElement);
                }
            });
            
            // Only reorder if we have sections to reorder and the order is different
            if (orderedSections.length === 0) return;
            
            // Check if order actually changed
            let orderChanged = false;
            for (let i = 0; i < orderedSections.length; i++) {
                if (allChildren[i] !== orderedSections[i]) {
                    orderChanged = true;
                    break;
                }
            }
            
            if (!orderChanged) return;
            
            // Reorder: remove all sections first, then append in new order
            // This ensures proper ordering
            orderedSections.forEach(section => {
                if (section.parentNode === dashboard) {
                    dashboard.removeChild(section);
                }
            });
            
            // Append sections in the new order
            orderedSections.forEach(section => {
                dashboard.appendChild(section);
            });
        },

        saveNavOrder() {
            return;
            const navTabs = document.querySelector('.status-nav-tabs');
            if (!navTabs) return;

            const navLinks = Array.from(navTabs.querySelectorAll('.nav-link'));
            const order = navLinks.map(link => link.getAttribute('data-section'));
            
            localStorage.setItem('nav-order', JSON.stringify(order));
        },

        restoreNavOrder() {
            return;
            const savedOrder = localStorage.getItem('nav-order');
            if (!savedOrder) return;

            try {
                const order = JSON.parse(savedOrder);
                const navTabs = document.querySelector('.status-nav-tabs');
                if (!navTabs) return;

                const navLinks = Array.from(navTabs.querySelectorAll('.nav-link'));
                const linkMap = new Map();
                navLinks.forEach(link => {
                    linkMap.set(link.getAttribute('data-section'), link);
                });

                // Reorder nav links
                order.forEach(sectionId => {
                    const link = linkMap.get(sectionId);
                    if (link) {
                        navTabs.appendChild(link);
                    }
                });

                // Reorder content sections to match
                this.reorderContentSections();
            } catch (e) {
                console.error('Error restoring nav order:', e);
            }
        },

        initMobileMenu() {
            const menuToggle = document.getElementById('mobile-menu-toggle');
            const menuOverlay = document.getElementById('mobile-menu-overlay');
            const menuClose = document.getElementById('mobile-menu-close');
            const menuNav = document.getElementById('mobile-menu-nav');
            
            if (!menuToggle || !menuOverlay || !menuClose || !menuNav) return;

            // Generate menu items from nav links
            const navLinks = document.querySelectorAll('.nav-link');
            menuNav.innerHTML = '';
            
            navLinks.forEach(link => {
                const sectionId = link.getAttribute('data-section');
                const icon = link.querySelector('.nav-file-icon')?.className || 'fas fa-circle';
                const label = link.querySelector('.nav-path')?.textContent || sectionId;
                
                const menuItem = document.createElement('a');
                menuItem.className = 'mobile-menu-item';
                menuItem.setAttribute('data-section', sectionId);
                menuItem.href = link.getAttribute('href') || `#${sectionId}`;
                
                menuItem.innerHTML = `
                    <i class="${icon} mobile-menu-item-icon"></i>
                    <span class="mobile-menu-item-label">${label}</span>
                `;
                
                menuItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleMobileMenuClick(sectionId);
                    this.closeMobileMenu();
                });
                
                menuNav.appendChild(menuItem);
            });

            // Toggle menu
            menuToggle.addEventListener('click', () => {
                this.openMobileMenu();
            });

            menuClose.addEventListener('click', () => {
                this.closeMobileMenu();
            });

            // Close on overlay click
            menuOverlay.addEventListener('click', (e) => {
                if (e.target === menuOverlay) {
                    this.closeMobileMenu();
                }
            });

            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && menuOverlay.classList.contains('active')) {
                    this.closeMobileMenu();
                }
            });
        },

        openMobileMenu() {
            const menuOverlay = document.getElementById('mobile-menu-overlay');
            if (menuOverlay) {
                // Set display first, then trigger animation on next frame
                menuOverlay.style.display = 'flex';
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        menuOverlay.classList.add('active');
                    });
                });
                document.body.style.overflow = 'hidden';
            }
        },

        closeMobileMenu() {
            const menuOverlay = document.getElementById('mobile-menu-overlay');
            if (menuOverlay) {
                menuOverlay.classList.remove('active');
                // Wait for animation to complete before hiding
                setTimeout(() => {
                    if (!menuOverlay.classList.contains('active')) {
                        menuOverlay.style.display = 'none';
                    }
                }, 350);
                document.body.style.overflow = '';
            }
        },

        scrollToSection(sectionId) {
            // Handle top/terminal link - scroll to hero section's actual position
            if (sectionId === 'top') {
                const heroSection = document.querySelector('.hero-section');
                if (heroSection) {
                    const offset = 96; // Account for fixed status bar with tabs
                    const targetPosition = heroSection.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                } else {
                    // Fallback to top if hero section not found
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
                return;
            }
            
            // Handle dashboard link - scroll to projects completed stat card
            if (sectionId === 'dashboard') {
                const navLinks = document.querySelectorAll('.nav-link');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('data-section') === 'dashboard') {
                        link.classList.add('active');
                    }
                });
                
                const projectsCompletedCard = document.querySelector('[data-card-id="stat-1"]');
                if (projectsCompletedCard) {
                    const offset = 96;
                    const targetPosition = projectsCompletedCard.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
                return;
            }
            
            // Handle other sections
            const target = document.getElementById(sectionId);
            if (target) {
                const offset = 96;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        },
        
        handleMobileMenuClick(sectionId) {
            // Use the same scroll logic as regular nav links
            const navLinks = document.querySelectorAll('.nav-link');
            const matchingLink = Array.from(navLinks).find(link => 
                link.getAttribute('data-section') === sectionId
            );
            
            if (matchingLink) {
                // Trigger click on the matching nav link to use existing scroll logic
                matchingLink.click();
            } else {
                // Fallback scroll logic
                this.scrollToSection(sectionId);
            }
            
            // Update active state in mobile menu
            document.querySelectorAll('.mobile-menu-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-section') === sectionId) {
                    item.classList.add('active');
                }
            });
        },

        updateActiveNav() {
            const navLinks = document.querySelectorAll('.nav-link');
            const sections = document.querySelectorAll('section[id]');
            const heroSection = document.querySelector('.hero-section');
            const statsGrid = document.querySelector('.stats-grid[data-section="stats"]');
            const scrollPosition = window.pageYOffset + 100; // Offset for better detection
            const mobileMenuItems = document.querySelectorAll('.mobile-menu-item');
            
            // Check if we're at the top (hero section)
            if (heroSection && scrollPosition < heroSection.offsetTop + heroSection.offsetHeight - 200) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('data-section') === 'top') {
                        link.classList.add('active');
                    }
                });
                // Update mobile menu
                mobileMenuItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('data-section') === 'top') {
                        item.classList.add('active');
                    }
                });
                return;
            }
            
            // Check if we're in the stats grid (dashboard) area
            if (statsGrid) {
                const statsTop = statsGrid.offsetTop;
                const statsHeight = statsGrid.offsetHeight;
                const nextSection = document.querySelector('section[id]');
                const nextSectionTop = nextSection ? nextSection.offsetTop : Infinity;
                
                // If we're in the stats grid area and haven't reached the next section
                if (scrollPosition >= statsTop && scrollPosition < nextSectionTop) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('data-section') === 'dashboard') {
                            link.classList.add('active');
                        }
                    });
                    // Update mobile menu
                    mobileMenuItems.forEach(item => {
                        item.classList.remove('active');
                        if (item.getAttribute('data-section') === 'dashboard') {
                            item.classList.add('active');
                        }
                    });
                    return;
                }
            }
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('data-section') === sectionId) {
                            link.classList.add('active');
                        }
                    });
                    // Update mobile menu
                    mobileMenuItems.forEach(item => {
                        item.classList.remove('active');
                        if (item.getAttribute('data-section') === sectionId) {
                            item.classList.add('active');
                        }
                    });
                }
            });
        }
    };

    // ============================================
    // THEME
    // ============================================
    const theme = {
        init() {
            const themeToggle = document.getElementById('theme-toggle');
            const themeIcon = document.getElementById('theme-icon');
            const html = document.documentElement;
            
            if (!themeToggle) {
                console.error('Theme toggle button not found');
                return;
            }
            
            if (!themeIcon) {
                console.error('Theme icon not found');
                return;
            }
            
            // Get saved theme or default to light
            const savedTheme = localStorage.getItem('theme') || 'light';
            html.setAttribute('data-theme', savedTheme);
            this.updateIcon(savedTheme, themeIcon);
            
            // Remove any existing listeners by cloning the button
            const newToggle = themeToggle.cloneNode(true);
            themeToggle.parentNode.replaceChild(newToggle, themeToggle);
            
            // Get the new elements
            const newThemeToggle = document.getElementById('theme-toggle');
            const newThemeIcon = document.getElementById('theme-icon');
            
            // Toggle theme on button click
            newThemeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const currentTheme = html.getAttribute('data-theme') || 'light';
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                console.log('Toggling theme from', currentTheme, 'to', newTheme);
                
                html.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                this.updateIcon(newTheme, newThemeIcon);
            });
        },

        updateIcon(theme, iconElement) {
            if (!iconElement) return;
            
            if (theme === 'light') {
                iconElement.classList.remove('fa-moon');
                iconElement.classList.add('fa-sun');
            } else {
                iconElement.classList.remove('fa-sun');
                iconElement.classList.add('fa-moon');
            }
        }
    };

    // ============================================
    // DRAG AND DROP
    // ============================================
    const dragdrop = {
        init() {
            const draggableCards = document.querySelectorAll('[draggable="true"]');
            let draggedElement = null;
            let draggedOverElement = null;
            
            // Restore saved order for each section
            this.restoreCardOrder();
            
            draggableCards.forEach(card => {
                // Prevent link navigation when dragging contact items
                if (card.tagName === 'A') {
                    card.addEventListener('click', (e) => {
                        if (card.classList.contains('dragging')) {
                            e.preventDefault();
                        }
                    });
                }
                
                card.addEventListener('dragstart', (e) => {
                    draggedElement = card;
                    card.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/html', card.outerHTML);
                });
                
                card.addEventListener('dragend', (e) => {
                    card.classList.remove('dragging');
                    // Remove any drag-over classes
                    document.querySelectorAll('.drag-over').forEach(el => {
                        el.classList.remove('drag-over');
                    });
                });
                
                card.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    
                    if (card !== draggedElement) {
                        const afterElement = this.getDragAfterElement(card.parentElement, e.clientY);
                        const dragging = document.querySelector('.dragging');
                        
                        if (afterElement == null) {
                            card.parentElement.appendChild(dragging);
                        } else {
                            card.parentElement.insertBefore(dragging, afterElement);
                        }
                    }
                });
                
                card.addEventListener('dragenter', (e) => {
                    e.preventDefault();
                    if (card !== draggedElement && !card.classList.contains('drag-over')) {
                        card.classList.add('drag-over');
                        draggedOverElement = card;
                    }
                });
                
                card.addEventListener('dragleave', (e) => {
                    if (card === draggedOverElement) {
                        card.classList.remove('drag-over');
                        draggedOverElement = null;
                    }
                });
                
                card.addEventListener('drop', (e) => {
                    e.preventDefault();
                    card.classList.remove('drag-over');
                    
                    if (draggedElement && draggedElement !== card) {
                        const parent = card.parentElement;
                        const section = parent.getAttribute('data-section');
                        
                        // Reorder cards
                        if (draggedElement.nextSibling === card) {
                            parent.insertBefore(card, draggedElement);
                        } else {
                            parent.insertBefore(draggedElement, card);
                        }
                        
                        // Save new order
                        this.saveCardOrder(section);
                    }
                });
            });
        },

        getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('[draggable="true"]:not(.dragging)')];
            
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        },

        saveCardOrder(section) {
            // Don't save order any sections
            return;
            
            const container = document.querySelector(`[data-section="${section}"]`);
            if (!container) return;
            
            const cards = Array.from(container.querySelectorAll('[draggable="true"]:not(.deleted)'));
            const order = cards.map(card => card.getAttribute('data-card-id'));
            
            localStorage.setItem(`card-order-${section}`, JSON.stringify(order));
        },

        restoreCardOrder() {
            const sections = ['stats', 'projects', 'skills', 'contact'];
            
            sections.forEach(section => {
                // Skip restoring order for stats section (dashboard cards)
                if (section === 'stats') {
                    return;
                }
                const savedOrder = localStorage.getItem(`card-order-${section}`);
                if (!savedOrder) return;
                
                const container = document.querySelector(`[data-section="${section}"]`);
                if (!container) return;
                
                try {
                    const order = JSON.parse(savedOrder);
                    const cards = Array.from(container.querySelectorAll('[draggable="true"]'));
                    
                    // Create a map of card IDs to elements
                    const cardMap = new Map();
                    cards.forEach(card => {
                        cardMap.set(card.getAttribute('data-card-id'), card);
                    });
                    
                    // Reorder based on saved order
                    order.forEach(cardId => {
                        const card = cardMap.get(cardId);
                        if (card) {
                            container.appendChild(card);
                        }
                    });
                } catch (e) {
                    console.error('Error restoring card order:', e);
                }
            });
        }
    };

    // ============================================
    // CARDS
    // ============================================
    const cards = {
        cardToDelete: null,

        init() {
            // Add controls to all cards that don't have them
            const allCards = document.querySelectorAll('.stat-card, .project-card, .skill-category, .contact-item, .distinction-item');
            
            allCards.forEach(card => {
                this.setupCard(card);
            });
        },

        setupCard(card) {
            // Check if controls already exist
            let controls = card.querySelector('.card-controls');
            const hasExistingControls = !!controls;
            
            // Wrap content if not already wrapped
            if (!card.querySelector('.card-content')) {
                const content = document.createElement('div');
                content.className = 'card-content';
                
                // Collect all children
                const children = Array.from(card.childNodes);
                const existingControls = card.querySelector('.card-controls');
                
                // Identify header/title elements to keep visible when minimized
                let titleElement = null;
                if (card.classList.contains('stat-card')) {
                    titleElement = card.querySelector('.stat-header');
                } else if (card.classList.contains('project-card')) {
                    titleElement = card.querySelector('.project-header');
                } else if (card.classList.contains('skill-category')) {
                    titleElement = card.querySelector('.category-title');
                } else if (card.classList.contains('contact-item')) {
                    // For contact items, create a container with both icon and label
                    const iconElement = card.querySelector('.contact-icon');
                    const labelElement = card.querySelector('.contact-label');
                    if (iconElement && labelElement) {
                        const titleContainer = document.createElement('div');
                        titleContainer.classList.add('card-title-minimized');
                        titleContainer.style.display = 'none';
                        
                        const iconClone = iconElement.cloneNode(true);
                        const labelClone = labelElement.cloneNode(true);
                        
                        titleContainer.appendChild(iconClone);
                        titleContainer.appendChild(labelClone);
                        
                        // Insert after existing controls if they exist, otherwise at start
                        if (existingControls && existingControls.nextSibling) {
                            card.insertBefore(titleContainer, existingControls.nextSibling);
                        } else if (existingControls) {
                            card.appendChild(titleContainer);
                        } else {
                            card.insertBefore(titleContainer, card.firstChild);
                        }
                    } else if (labelElement) {
                        const titleClone = labelElement.cloneNode(true);
                        titleClone.classList.add('card-title-minimized');
                        titleClone.style.display = 'none';
                        // Insert after existing controls if they exist, otherwise at start
                        if (existingControls && existingControls.nextSibling) {
                            card.insertBefore(titleClone, existingControls.nextSibling);
                        } else if (existingControls) {
                            card.appendChild(titleClone);
                        } else {
                            card.insertBefore(titleClone, card.firstChild);
                        }
                    }
                } else if (titleElement) {
                    const titleClone = titleElement.cloneNode(true);
                    titleClone.classList.add('card-title-minimized');
                    titleClone.style.display = 'none';
                    // Insert after existing controls if they exist, otherwise at start
                    if (existingControls && existingControls.nextSibling) {
                        card.insertBefore(titleClone, existingControls.nextSibling);
                    } else if (existingControls) {
                        card.appendChild(titleClone);
                    } else {
                        card.insertBefore(titleClone, card.firstChild);
                    }
                }
                
                // Move all children to content, preserving order
                // The titleElement should be first in content (except for contact items which handle it differently)
                if (titleElement && !card.classList.contains('contact-item')) {
                    // Insert titleElement first
                    content.appendChild(titleElement);
                }
                
                // Move all other children to content (but exclude the titleElement and minimized title)
                children.forEach(child => {
                    if (child !== existingControls && 
                        child.nodeType === Node.ELEMENT_NODE && 
                        !child.classList.contains('card-title-minimized') &&
                        child !== titleElement) {
                        content.appendChild(child);
                    }
                });
                
                // Insert content after title or existing controls
                const insertAfter = card.querySelector('.card-title-minimized') || existingControls;
                if (insertAfter) {
                    card.insertBefore(content, insertAfter.nextSibling);
                } else {
                    card.appendChild(content);
                }
            } else {
                // Card already has content, but we need to ensure minimized title exists
                if (!card.querySelector('.card-title-minimized')) {
                    const existingControls = card.querySelector('.card-controls');
                    let titleElement = null;
                    
                    if (card.classList.contains('stat-card')) {
                        titleElement = card.querySelector('.stat-header');
                        if (titleElement) {
                            const titleClone = titleElement.cloneNode(true);
                            titleClone.classList.add('card-title-minimized');
                            titleClone.style.display = 'none';
                            // Insert after controls
                            if (existingControls && existingControls.nextSibling) {
                                card.insertBefore(titleClone, existingControls.nextSibling);
                            } else if (existingControls) {
                                card.appendChild(titleClone);
                            } else {
                                card.insertBefore(titleClone, card.firstChild);
                            }
                        }
                    } else if (card.classList.contains('project-card')) {
                        titleElement = card.querySelector('.project-header');
                        if (titleElement) {
                            const titleClone = titleElement.cloneNode(true);
                            titleClone.classList.add('card-title-minimized');
                            titleClone.style.display = 'none';
                            // Insert after controls
                            if (existingControls && existingControls.nextSibling) {
                                card.insertBefore(titleClone, existingControls.nextSibling);
                            } else if (existingControls) {
                                card.appendChild(titleClone);
                            } else {
                                card.insertBefore(titleClone, card.firstChild);
                            }
                        }
                    } else if (card.classList.contains('skill-category')) {
                        titleElement = card.querySelector('.category-title');
                        if (titleElement) {
                            const titleClone = titleElement.cloneNode(true);
                            titleClone.classList.add('card-title-minimized');
                            titleClone.style.display = 'none';
                            // Insert after controls
                            if (existingControls && existingControls.nextSibling) {
                                card.insertBefore(titleClone, existingControls.nextSibling);
                            } else if (existingControls) {
                                card.appendChild(titleClone);
                            } else {
                                card.insertBefore(titleClone, card.firstChild);
                            }
                        }
                    } else if (card.classList.contains('distinction-item')) {
                        const distinctionHeader = card.querySelector('.distinction-header');
                        if (distinctionHeader) {
                            const titleContainer = document.createElement('div');
                            titleContainer.classList.add('card-title-minimized');
                            titleContainer.style.display = 'none';
                            
                            const iconElement = distinctionHeader.querySelector('.distinction-icon');
                            const nameElement = distinctionHeader.querySelector('.distinction-name');
                            
                            if (iconElement && nameElement) {
                                const iconClone = iconElement.cloneNode(true);
                                const nameClone = nameElement.cloneNode(true);
                                
                                titleContainer.appendChild(iconClone);
                                titleContainer.appendChild(nameClone);
                                
                                // Insert after controls
                                if (existingControls && existingControls.nextSibling) {
                                    card.insertBefore(titleContainer, existingControls.nextSibling);
                                } else if (existingControls) {
                                    card.appendChild(titleContainer);
                                } else {
                                    card.insertBefore(titleContainer, card.firstChild);
                                }
                            }
                        }
                    } else if (card.classList.contains('contact-item')) {
                        // For contact items, create a container with both icon and label
                        const iconElement = card.querySelector('.contact-icon');
                        const labelElement = card.querySelector('.contact-label');
                        if (iconElement && labelElement) {
                            const titleContainer = document.createElement('div');
                            titleContainer.classList.add('card-title-minimized');
                            titleContainer.style.display = 'none';
                            
                            const iconClone = iconElement.cloneNode(true);
                            const labelClone = labelElement.cloneNode(true);
                            
                            titleContainer.appendChild(iconClone);
                            titleContainer.appendChild(labelClone);
                            
                            // Insert after controls
                            if (existingControls && existingControls.nextSibling) {
                                card.insertBefore(titleContainer, existingControls.nextSibling);
                            } else if (existingControls) {
                                card.appendChild(titleContainer);
                            } else {
                                card.insertBefore(titleContainer, card.firstChild);
                            }
                        } else if (labelElement) {
                            const titleClone = labelElement.cloneNode(true);
                            titleClone.classList.add('card-title-minimized');
                            titleClone.style.display = 'none';
                            // Insert after controls
                            if (existingControls && existingControls.nextSibling) {
                                card.insertBefore(titleClone, existingControls.nextSibling);
                            } else if (existingControls) {
                                card.appendChild(titleClone);
                            } else {
                                card.insertBefore(titleClone, card.firstChild);
                            }
                        }
                    } else if (titleElement) {
                        const titleClone = titleElement.cloneNode(true);
                        titleClone.classList.add('card-title-minimized');
                        titleClone.style.display = 'none';
                        // Insert after controls
                        if (existingControls && existingControls.nextSibling) {
                            card.insertBefore(titleClone, existingControls.nextSibling);
                        } else if (existingControls) {
                            card.appendChild(titleClone);
                        } else {
                            card.insertBefore(titleClone, card.firstChild);
                        }
                    }
                }
            }
            
            // Create controls if they don't exist, or get existing ones
            if (!controls) {
                controls = document.createElement('div');
                controls.className = 'card-controls';
                
                // Only add minimize button if not a skill-category
                if (!card.classList.contains('skill-category')) {
                    const minimizeBtn = document.createElement('button');
                    minimizeBtn.className = 'card-control-btn minimize-btn';
                    minimizeBtn.setAttribute('aria-label', 'Minimize card');
                    minimizeBtn.setAttribute('title', 'Minimize');
                    minimizeBtn.innerHTML = '<i class="fas fa-minus"></i>';
                    controls.appendChild(minimizeBtn);
                }
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'card-control-btn delete-btn';
                deleteBtn.setAttribute('aria-label', 'Delete card');
                deleteBtn.setAttribute('title', 'Delete');
                deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
                
                controls.appendChild(deleteBtn);
                card.insertBefore(controls, card.firstChild);
            }
            
            // Get buttons (either newly created or existing)
            const minimizeBtn = controls.querySelector('.minimize-btn');
            const deleteBtn = controls.querySelector('.delete-btn');
            
            // Remove existing listeners if any (to avoid duplicates) and add new ones
            if (minimizeBtn) {
                const newMinimizeBtn = minimizeBtn.cloneNode(true);
                minimizeBtn.replaceWith(newMinimizeBtn);
                newMinimizeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.toggleMinimize(card);
                });
            }
            
            const newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.replaceWith(newDeleteBtn);
            
            newDeleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.deleteCard(card);
            });
            
            // Prevent dragging when clicking controls
            controls.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
        },

        checkAllMinimized(gridContainer) {
            if (!gridContainer) return;
            
            const cards = gridContainer.querySelectorAll('.stat-card, .project-card, .skill-category, .contact-item, .distinction-item');
            if (cards.length === 0) return;
            
            const allMinimized = Array.from(cards).every(card => card.classList.contains('minimized'));
            
            if (allMinimized) {
                gridContainer.classList.add('all-minimized');
            } else {
                gridContainer.classList.remove('all-minimized');
            }
        },

        toggleMinimize(card) {
            const isMinimized = card.classList.contains('minimized');
            let minimizedTitle = card.querySelector('.card-title-minimized');
            const cardContent = card.querySelector('.card-content');
            const gridContainer = card.closest('.stats-grid, .projects-grid, .skills-container, .contact-grid, .distinctions-container');
            
            // If minimized title doesn't exist, try to create it
            if (!minimizedTitle) {
                const existingControls = card.querySelector('.card-controls');
                let titleElement = null;
                
                if (card.classList.contains('stat-card')) {
                    titleElement = card.querySelector('.stat-header');
                } else if (card.classList.contains('project-card')) {
                    titleElement = card.querySelector('.project-header');
                } else if (card.classList.contains('skill-category')) {
                    titleElement = card.querySelector('.category-title');
                } else if (card.classList.contains('distinction-item')) {
                    titleElement = card.querySelector('.distinction-header');
                }
                
                if (titleElement) {
                    const titleClone = titleElement.cloneNode(true);
                    titleClone.classList.add('card-title-minimized');
                    titleClone.style.display = 'none';
                    // Insert after controls
                    if (existingControls && existingControls.nextSibling) {
                        card.insertBefore(titleClone, existingControls.nextSibling);
                    } else if (existingControls) {
                        card.appendChild(titleClone);
                    } else {
                        card.insertBefore(titleClone, card.firstChild);
                    }
                    minimizedTitle = titleClone;
                }
            }
            
            if (isMinimized) {
                card.classList.remove('minimized');
                // Hide the minimized title when expanding
                if (minimizedTitle) {
                    minimizedTitle.style.display = 'none';
                }
            } else {
                // Hide original title elements immediately to prevent double display
                if (cardContent) {
                    const originalTitle = cardContent.querySelector('.stat-header, .project-header, .category-title, .contact-label, .contact-icon, .distinction-header');
                    if (originalTitle) {
                        originalTitle.style.display = 'none';
                    }
                }
                // For contact items, also hide the value when minimizing (check both card-content and direct children)
                if (card.classList.contains('contact-item')) {
                    const contactValue = cardContent ? cardContent.querySelector('.contact-value') : card.querySelector('.contact-value');
                    if (contactValue) {
                        contactValue.style.display = 'none';
                    }
                }
                
                card.classList.add('minimized');
                // Show the minimized title when minimizing
                if (minimizedTitle) {
                    minimizedTitle.style.display = '';
                }
            }
            
            // Update icon
            const minimizeBtn = card.querySelector('.minimize-btn i');
            if (minimizeBtn) {
                minimizeBtn.className = card.classList.contains('minimized') ? 'fas fa-plus' : 'fas fa-minus';
            }
            
            // Restore original title display when expanding (after transition)
            if (!isMinimized) {
                setTimeout(() => {
                    if (cardContent && !card.classList.contains('minimized')) {
                        const originalTitle = cardContent.querySelector('.stat-header, .project-header, .category-title, .contact-label, .contact-icon, .distinction-header');
                        if (originalTitle) {
                            originalTitle.style.display = '';
                        }
                    }
                }, 300);
            } else {
                // Restore immediately when expanding
                if (cardContent) {
                    const originalTitle = cardContent.querySelector('.stat-header, .project-header, .category-title, .contact-label, .contact-icon, .distinction-header');
                    if (originalTitle) {
                        originalTitle.style.display = '';
                    }
                }
                // For contact items, also restore the value when expanding (check both card-content and direct children)
                if (card.classList.contains('contact-item')) {
                    const contactValue = cardContent ? cardContent.querySelector('.contact-value') : card.querySelector('.contact-value');
                    if (contactValue) {
                        contactValue.style.display = '';
                    }
                }
            }
            
            // Check if all cards in the grid are minimized
            this.checkAllMinimized(gridContainer);
        },

        deleteCard(card) {
            this.cardToDelete = card;
            modals.showDelete();
        }
    };

    // ============================================
    // MODALS
    // ============================================
    const modals = {
        initDelete() {
            const modal = document.getElementById('delete-modal');
            const closeBtn = document.getElementById('modal-close-btn');
            const cancelBtn = document.getElementById('modal-cancel-btn');
            const deleteBtn = document.getElementById('modal-delete-btn');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideDelete());
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.hideDelete());
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.confirmDelete());
            }
            
            // Close modal when clicking overlay
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.hideDelete();
                    }
                });
            }
            
            // Close modal with Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
                    this.hideDelete();
                }
            });
        },

        showDelete() {
            const modal = document.getElementById('delete-modal');
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        },

        hideDelete() {
            const modal = document.getElementById('delete-modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
            cards.cardToDelete = null;
        },

        confirmDelete() {
            if (cards.cardToDelete) {
                const parent = cards.cardToDelete.parentElement;
                const section = parent.getAttribute('data-section');
                const gridContainer = cards.cardToDelete.closest('.stats-grid, .projects-grid, .skills-container, .contact-grid, .distinctions-container');
                
                // Remove from DOM
                cards.cardToDelete.remove();
                
                // Update order
                if (section) {
                    dragdrop.saveCardOrder(section);
                }
                
                // Check if all remaining cards are minimized
                cards.checkAllMinimized(gridContainer);
                
                this.hideDelete();
            }
        },

        initCloseTab() {
            const closeTabModal = document.getElementById('close-tab-modal');
            const closeTabCloseBtn = document.getElementById('close-tab-modal-close-btn');
            const closeTabCancelBtn = document.getElementById('close-tab-cancel-btn');
            const closeTabConfirmBtn = document.getElementById('close-tab-confirm-btn');
            const closeTabMessage = document.getElementById('close-tab-message');
            
            let tabToClose = null;
            
            function openCloseTabModal(sectionId, tabName) {
                tabToClose = sectionId;
                closeTabMessage.textContent = `Are you sure you want to close "${tabName}"? This action cannot be undone.`;
                closeTabModal.classList.add('active');
            }
            
            function closeCloseTabModal() {
                closeTabModal.classList.remove('active');
                tabToClose = null;
            }
            
            function confirmCloseTab() {
                if (!tabToClose) return;
                
                const navLink = document.querySelector(`.nav-link[data-section="${tabToClose}"]`);
                const footerNavLink = document.querySelector(`.footer-nav-link[data-section="${tabToClose}"]`);
                const section = tabToClose === 'top' ? document.querySelector('.hero-section') : document.getElementById(tabToClose);
                
                if (navLink) {
                    navLink.style.display = 'none';
                }
                
                // Also hide the corresponding footer nav link
                if (footerNavLink) {
                    footerNavLink.style.display = 'none';
                }
                
                if (section) {
                    section.style.display = 'none';
                }
                
                // If closing Terminal or Dashboard, also hide the stats grid below it
                if (tabToClose === 'top' || tabToClose === 'dashboard') {
                    const statsGrid = document.querySelector('.stats-grid');
                    if (statsGrid) {
                        statsGrid.style.display = 'none';
                    }
                }
                
                // If the closed tab was active, switch to another visible tab
                if (navLink && navLink.classList.contains('active')) {
                    const visibleTabs = Array.from(document.querySelectorAll('.nav-link:not([style*="display: none"])'));
                    if (visibleTabs.length > 0) {
                        const firstTab = visibleTabs[0];
                        const targetSection = firstTab.getAttribute('data-section');
                        if (targetSection === 'top') {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                            const target = document.getElementById(targetSection);
                            if (target) {
                                const offset = 96;
                                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                            }
                        }
                    }
                }
                
                closeCloseTabModal();
            }
            
            // Event listeners
            closeTabCloseBtn.addEventListener('click', closeCloseTabModal);
            closeTabCancelBtn.addEventListener('click', closeCloseTabModal);
            closeTabConfirmBtn.addEventListener('click', confirmCloseTab);
            
            closeTabModal.addEventListener('click', (e) => {
                if (e.target === closeTabModal) {
                    closeCloseTabModal();
                }
            });
            
            // Expose function globally
            window.openCloseTabModal = openCloseTabModal;
        }
    };

    // ============================================
    // CODE COLLAPSIBLE
    // ============================================
    const code = {
        toggleFold(foldTarget) {
            const foldIndicator = document.querySelector(`.fold-indicator[data-fold-target="${foldTarget}"]`);
            if (!foldIndicator) return;
            
            const isCollapsed = foldIndicator.classList.contains('collapsed');
            
            // Toggle the indicator state
            if (isCollapsed) {
                foldIndicator.classList.remove('collapsed');
            } else {
                foldIndicator.classList.add('collapsed');
            }
            
            // Update visibility of all lines based on all fold states
            this.updateLineVisibility();
        },

        updateLineVisibility() {
            // Get all foldable lines
            const allLines = document.querySelectorAll('.code-foldable');
            
            allLines.forEach(line => {
                const foldIds = line.getAttribute('data-fold-id').split(' ').filter(id => id.trim());
                
                // Check if this line contains a fold indicator (it's the parent line)
                const lineFoldIndicator = line.querySelector('.fold-indicator[data-fold-target]');
                const lineFoldTarget = lineFoldIndicator ? lineFoldIndicator.getAttribute('data-fold-target') : null;
                
                let shouldShow = true;
                
                // A line is visible only if ALL its fold-ids are expanded
                // Exception: the line that contains a fold indicator is always visible for that fold
                foldIds.forEach(id => {
                    const indicator = document.querySelector(`.fold-indicator[data-fold-target="${id}"]`);
                    if (indicator && indicator.classList.contains('collapsed')) {
                        // Don't hide the line that contains the fold indicator itself
                        // Only hide content lines that are children of the collapsed fold
                        if (lineFoldTarget !== id) {
                            shouldShow = false;
                        }
                    }
                });
                
                // Update the line visibility
                if (shouldShow) {
                    line.classList.remove('folded');
                } else {
                    line.classList.add('folded');
                }
            });
        },

        init() {
            const foldIndicators = document.querySelectorAll('.fold-indicator.foldable');
            
            foldIndicators.forEach(indicator => {
                // Skip if listener already added
                if (indicator.dataset.listenerAdded === 'true') {
                    return;
                }
                
                // Mark as having listener added
                indicator.dataset.listenerAdded = 'true';
                
                indicator.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const foldTarget = indicator.getAttribute('data-fold-target');
                    if (foldTarget) {
                        code.toggleFold(foldTarget);
                    }
                });
            });
        }
    };

    // ============================================
    // PORTFOLIO
    // ============================================
    const portfolio = {
        // Load portfolio data and generate content
        async load() {
            try {
                // Try to load portfolio.json with cache busting
                const url = './portfolio.json?v=' + new Date().getTime();
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                    cache: 'no-cache'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                if (!data || !data.projects) {
                    throw new Error('Invalid portfolio data structure');
                }
                
                portfolioData = data;
                console.log('Portfolio data loaded:', portfolioData);
                this.generateContent();
            } catch (error) {
                console.error('Error loading portfolio.json:', error);
                console.error('URL attempted:', './portfolio.json');
                // Show user-friendly error
                const dashboard = document.querySelector('.dashboard');
                if (dashboard && !document.querySelector('.portfolio-error')) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'portfolio-error';
                    errorDiv.style.cssText = 'padding: 20px; margin: 20px; background: var(--card-bg); border: 1px solid var(--accent-red); border-radius: 8px; color: var(--accent-red);';
                    errorDiv.innerHTML = '<strong>Error loading portfolio data.</strong> Please refresh the page or check the console for details.';
                    dashboard.insertBefore(errorDiv, dashboard.firstChild);
                }
            }
        },

        // Generate all portfolio content from JSON
        generateContent() {
            if (!portfolioData) return;
            
            this.generateAbout();
            this.generateStats();
            this.generateProjects();
            this.generateSkills();
            this.generateContact();
            this.generateDistinctions();
            
            // Initialize card controls after content is generated
            cards.init();
            dragdrop.init();
            animations.initCounters();
            // animations.initSkillBars(); // REMOVED: Skills now use YAML format, not progress bars
            
            // Check initial state of all grids
            document.querySelectorAll('.stats-grid, .projects-grid, .skills-container, .contact-grid, .distinctions-container').forEach(grid => {
                cards.checkAllMinimized(grid);
            });
            
            // Restore nav order after content is generated (sections need to exist)
            navigation.restoreNavOrder();
            
            // Regenerate mobile menu after content loads (in case nav links changed)
            if (window.innerWidth <= 768) {
                navigation.initMobileMenu();
            }
            
            // Add dynamic behavior to project cards
            const projectCards = document.querySelectorAll('.project-card');
            projectCards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    if (!this.classList.contains('dragging')) {
                        this.style.transform = 'translateY(-4px)';
                    }
                });
                
                card.addEventListener('mouseleave', function() {
                    if (!this.classList.contains('dragging')) {
                        this.style.transform = 'translateY(0)';
                    }
                });
            });
        },

        // Generate stat cards
        generateStats() {
            const statsGrid = document.querySelector('.stats-grid[data-section="stats"]');
            if (!statsGrid) {
                console.error('Stats grid not found');
                return;
            }
            
            statsGrid.innerHTML = '';
            
            // Calculate projects completed from portfolio data
            const projectsCompleted = portfolioData.projects ? portfolioData.projects.length : 0;
            
            // Calculate years experience from June 2011
            const startDate = new Date(2011, 5, 1); // June 2011 (month is 0-indexed)
            const currentDate = new Date();
            const yearsExperience = ((currentDate - startDate) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
            
            // Calculate active projects (projects with null end_year - ongoing)
            const activeProjects = portfolioData.projects ? portfolioData.projects.filter(project => {
                return project.end_year == null || project.end_year === undefined;
            }).length : 0;
            
            // Define stats (keeping lines of code and uptime as is)
            const stats = [
                {
                    id: 'stat-1',
                    label: 'PROJECTS',
                    icon: 'fas fa-chart-bar',
                    value: projectsCompleted,
                    footer: 'Completed & deployed',
                    isStatic: false
                },
                {
                    id: 'stat-2',
                    label: 'YEARS EXPERIENCE',
                    icon: 'fas fa-clock',
                    value: parseFloat(yearsExperience),
                    footer: 'In the field',
                    isStatic: false
                },
                {
                    id: 'stat-3',
                    label: 'ACTIVE PROJECTS',
                    icon: 'fas fa-rocket',
                    value: activeProjects,
                    footer: 'Being supported',
                    isStatic: false
                },
                {
                    id: 'stat-4',
                    label: 'UPTIME',
                    icon: 'fas fa-bolt',
                    value: '99.9%',
                    footer: 'Who needs sleep?',
                    isStatic: true
                }
            ];
            
            stats.forEach(stat => {
                const statCard = document.createElement('div');
                statCard.className = 'stat-card';
                statCard.setAttribute('draggable', 'true');
                statCard.setAttribute('data-card-id', stat.id);
                
                statCard.innerHTML = `
                    <div class="card-controls">
                        <button class="card-control-btn minimize-btn" aria-label="Minimize card" title="Minimize">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="card-control-btn delete-btn" aria-label="Delete card" title="Delete">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="card-content">
                        <div class="stat-header">
                            <span class="stat-label">${stat.label}</span>
                            <span class="stat-icon"><i class="${stat.icon}"></i></span>
                        </div>
                        <div class="stat-value" ${stat.isStatic ? (stat.id === 'stat-4' ? 'id="uptime"' : '') : `data-target="${stat.value}"`}>${stat.isStatic ? stat.value : '0'}</div>
                        <div class="stat-footer">${stat.footer}</div>
                    </div>
                `;
                
                statsGrid.appendChild(statCard);
            });
        },

        // Generate project cards
        generateProjects() {
            const projectsGrid = document.querySelector('.projects-grid[data-section="projects"]');
            if (!projectsGrid) {
                console.error('Projects grid not found');
                return;
            }
            if (!portfolioData.projects) {
                console.error('No projects data in portfolio');
                return;
            }
            
            console.log('Generating projects:', portfolioData.projects);
            projectsGrid.innerHTML = '';
            
            // Sort projects: descending by end_year if available, otherwise start_year, then alphabetically
            // Projects without years go to the end
            const sortedProjects = [...portfolioData.projects].sort((a, b) => {
                // Get the primary year for sorting (end_year if available, otherwise start_year)
                const aYear = a.end_year != null ? a.end_year : a.start_year;
                const bYear = b.end_year != null ? b.end_year : b.start_year;
                
                // If one has a year and the other doesn't, the one with year comes first
                if (aYear == null && bYear != null) return 1;
                if (aYear != null && bYear == null) return -1;
                if (aYear == null && bYear == null) {
                    // Both have no years, sort alphabetically
                    return (a.name || '').localeCompare(b.name || '');
                }
                
                // Both have years, sort by year (descending)
                if (bYear !== aYear) {
                    return bYear - aYear;
                }
                
                // If years are equal, sort alphabetically by name
                return (a.name || '').localeCompare(b.name || '');
            });
            
            sortedProjects.forEach(project => {
                const projectCard = document.createElement('div');
                projectCard.className = 'project-card';
                projectCard.setAttribute('draggable', 'true');
                projectCard.setAttribute('data-card-id', project.id);
                
                const techTags = (project.tech || []).map(tech => `<span class="tech-tag">${tech}</span>`).join('');
                const previewInfo = `
                    ${(project.start_year || project.end_year) ? `<div class="metric">
                        <span class="metric-label">When</span>
                        <span class="metric-value">${project.end_year || project.start_year}</span>
                    </div>` : ''}
                    ${project.company ? `<div class="metric">
                        <span class="metric-label">Company</span>
                        <span class="metric-value">${project.company}</span>
                    </div>` : ''}
                `;
                
                projectCard.innerHTML = `
                    <div class="project-header">
                        <span class="project-status ${project.status}" data-tooltip="${project.status.toUpperCase()}"></span>
                        <h3 class="project-name">${project.name}</h3>
                    </div>
                    <div class="project-content">
                        <p class="project-description">${project.shortDescription || project.description}</p>
                        
                    </div>
                    <div class="project-footer">
                        <div class="project-tech">
                            ${techTags}
                        </div>
                        <div class="project-metrics">
                            ${previewInfo}
                        </div>
                        <button class="view-logs-btn" data-project-id="${project.id}" aria-label="View log">
                            <i class="fas fa-file-alt"></i> View Log
                        </button>
                    </div>
                `;
                
                // Add click handler for View Logs button (only on desktop)
                const viewLogsBtn = projectCard.querySelector('.view-logs-btn');
                if (viewLogsBtn) {
                    viewLogsBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // Check if mobile before opening
                        if (window.innerWidth <= 768) {
                            return;
                        }
                        if (window.openLogsPanel) {
                            window.openLogsPanel(project.id);
                        }
                    });
                }
                
                projectsGrid.appendChild(projectCard);
            });
        },

        // Generate skill categories as YAML config files
        generateSkills() {
            const skillsContainer = document.querySelector('.skills-container[data-section="skills"]');
            if (!skillsContainer) {
                console.error('Skills container not found');
                return;
            }
            if (!portfolioData.skills) {
                console.error('No skills data in portfolio');
                return;
            }
            
            console.log('Generating skills:', portfolioData.skills);
            skillsContainer.innerHTML = '';
            
            // Sort skills by item count (descending) so rows align better
            const sortedSkills = [...portfolioData.skills].sort((a, b) => {
                const aCount = a.items ? a.items.length : 0;
                const bCount = b.items ? b.items.length : 0;
                return bCount - aCount; // Descending order (most items first)
            });
            
            sortedSkills.forEach(skill => {
                // Create a card for each skill category
                const skillCard = document.createElement('div');
                skillCard.className = 'skill-category';
                skillCard.setAttribute('draggable', 'true');
                skillCard.setAttribute('data-card-id', skill.id);
                
                // Create code block structure (similar to About section)
                const codeBlock = document.createElement('div');
                codeBlock.className = 'code-block';
                
                const codeEditor = document.createElement('div');
                codeEditor.className = 'code-editor';
                
                const codeLines = document.createElement('div');
                codeLines.className = 'code-lines';
                
                let lineNumber = 1;
                const foldId = `skills-${skill.id}`;
                
                // File header comment
                const commentLine = this.createCodeLine(lineNumber++, null, `<span class="code-comment"># ${skill.category}</span>`);
                codeLines.appendChild(commentLine);
                
                // Category name as YAML key (collapsible)
                const categoryKey = skill.category.toLowerCase().replace(/\s+/g, '_');
                const categoryLine = this.createCodeLine(lineNumber++, foldId, `<span class="code-property">${categoryKey}</span>:`, true, 0, foldId);
                codeLines.appendChild(categoryLine);
                
                // Get skills list and sort alphabetically
                const skillNames = [];
                if (skill.items && Array.isArray(skill.items)) {
                    skill.items.forEach(item => {
                        skillNames.push(item.name || item);
                    });
                } else if (typeof skill === 'string') {
                    skillNames.push(skill);
                }
                
                // Sort alphabetically (case-insensitive)
                skillNames.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
                
                // Each skill as a simple YAML list item
                skillNames.forEach((skillName) => {
                    const skillLine = this.createCodeLine(lineNumber++, foldId, `  - <span class="code-string">"${skillName}"</span>`, false, 1);
                    codeLines.appendChild(skillLine);
                });
                
                codeEditor.appendChild(codeLines);
                codeBlock.appendChild(codeEditor);
                
                skillCard.appendChild(codeBlock);
                skillsContainer.appendChild(skillCard);
            });
            
            // Initialize collapsible functionality after generation
            code.init();
        },

        // Generate About section with collapsible code editor
        generateAbout() {
            const aboutCard = document.querySelector('.content-section[data-section="about"] .content-card');
            if (!aboutCard) {
                console.error('About section card not found');
                return;
            }
            if (!portfolioData.about) {
                console.error('No about data in portfolio');
                return;
            }
            
            const about = portfolioData.about;
            let lineNumber = 1;
            
            // Create code block structure
            const codeBlock = document.createElement('div');
            codeBlock.className = 'code-block';
            
            const codeEditor = document.createElement('div');
            codeEditor.className = 'code-editor';
            
            const codeLines = document.createElement('div');
            codeLines.className = 'code-lines';
            
            // Line 1: Comment
            const commentLine = this.createCodeLine(lineNumber++, null, `<span class="code-comment">// About ${about.name}</span>`);
            codeLines.appendChild(commentLine);
            
            // Line 2: const developer = {
            const constLine = this.createCodeLine(lineNumber++, 'object-content', `<span class="code-keyword">const</span> <span class="code-var">person</span> = {`, true, 0, 'object-content');
            codeLines.appendChild(constLine);
            
            // Line 3: name
            const nameLine = this.createCodeLine(lineNumber++, 'object-content', `<span class="code-property">name</span>: <span class="code-string">"${about.name}"</span>,`, false, 1);
            codeLines.appendChild(nameLine);
            
            // Line 4: roles (handle array)
            const rolesStartLine = this.createCodeLine(lineNumber++, 'object-content', `<span class="code-property">roles</span>: [`, true, 1, 'roles-array');
            codeLines.appendChild(rolesStartLine);
            
            // Roles array items
            if (about.roles && Array.isArray(about.roles)) {
                about.roles.forEach((role, index) => {
                    const isLast = index === about.roles.length - 1;
                    const roleLine = this.createCodeLine(lineNumber++, 'roles-array object-content', `<span class="code-string">"${role}"</span>${isLast ? '' : ','}`, false, 2);
                    codeLines.appendChild(roleLine);
                });
            }
            
            // Closing bracket for roles array
            const rolesEndLine = this.createCodeLine(lineNumber++, 'object-content', `],`, false, 1);
            codeLines.appendChild(rolesEndLine);
            
            // Line 5: location
            const locationLine = this.createCodeLine(lineNumber++, 'object-content', `<span class="code-property">location</span>: <span class="code-string">"${about.location}"</span>,`, false, 1);
            codeLines.appendChild(locationLine);
            
            // Line 6: skills: [
            const skillsStartLine = this.createCodeLine(lineNumber++, 'object-content', `<span class="code-property">skills</span>: [`, true, 1, 'skills-array');
            codeLines.appendChild(skillsStartLine);
            
            // Skills array items
            if (about.skills && Array.isArray(about.skills)) {
                about.skills.forEach((skill, index) => {
                    const isLast = index === about.skills.length - 1;
                    const skillLine = this.createCodeLine(lineNumber++, 'skills-array object-content', `<span class="code-string">"${skill}"</span>${isLast ? '' : ','}`, false, 2);
                    codeLines.appendChild(skillLine);
                });
            }
            
            // Closing bracket for skills array
            const skillsEndLine = this.createCodeLine(lineNumber++, 'object-content', `],`, false, 1);
            codeLines.appendChild(skillsEndLine);
            
            // Last property: passion
            const passionLine = this.createCodeLine(lineNumber++, 'object-content', `<span class="code-property">passion</span>: <span class="code-string">"${about.passion}"</span>`, false, 1);
            codeLines.appendChild(passionLine);
            
            // Closing brace
            const closingLine = this.createCodeLine(lineNumber++, null, `};`, false, 0);
            codeLines.appendChild(closingLine);
            
            codeEditor.appendChild(codeLines);
            codeBlock.appendChild(codeEditor);
            
            // Clear and populate the about card
            aboutCard.innerHTML = '';
            aboutCard.appendChild(codeBlock);
            
            // Initialize collapsible functionality after generation
            code.init();
        },

        // Helper function to create a code line
        createCodeLine(num, foldId, content, isFoldable = false, indent = 0, foldTarget = null) {
            const line = document.createElement('div');
            line.className = `code-line`;
            if (indent > 0) {
                line.classList.add(`code-indent-${indent}`);
            }
            if (foldId) {
                line.classList.add('code-foldable');
                line.setAttribute('data-fold-id', foldId);
            }
            
            const lineNum = document.createElement('span');
            lineNum.className = 'line-number';
            lineNum.textContent = num;
            
            const foldIndicator = document.createElement('span');
            foldIndicator.className = 'fold-indicator';
            if (isFoldable && foldTarget) {
                foldIndicator.classList.add('foldable');
                foldIndicator.setAttribute('data-fold-target', foldTarget);
            }
            
            const codeContent = document.createElement('span');
            codeContent.className = 'code-content';
            codeContent.innerHTML = content;
            
            line.appendChild(lineNum);
            line.appendChild(foldIndicator);
            line.appendChild(codeContent);
            
            return line;
        },

        // Generate contact items
        generateContact() {
            const contactGrid = document.querySelector('.contact-grid[data-section="contact"]');
            if (!contactGrid) {
                console.error('Contact grid not found');
                return;
            }
            if (!portfolioData.contact) {
                console.error('No contact data in portfolio');
                return;
            }
            
            console.log('Generating contact:', portfolioData.contact);
            contactGrid.innerHTML = '';
            
            portfolioData.contact.forEach(contact => {
                const contactItem = document.createElement('a');
                contactItem.className = 'contact-item';
                contactItem.setAttribute('draggable', 'true');
                contactItem.setAttribute('data-card-id', contact.id);
                contactItem.setAttribute('href', contact.url);
                if (contact.url.startsWith('http')) {
                    contactItem.setAttribute('target', '_blank');
                }
                
                const cardContent = document.createElement('div');
                cardContent.className = 'card-content';
                cardContent.innerHTML = `
                    <span class="contact-icon"><i class="${contact.icon}"></i></span>
                    <span class="contact-label">${contact.label}</span>
                    <span class="contact-value">[${contact.label}](${contact.value})</span>
                `;
                contactItem.appendChild(cardContent);
                
                contactGrid.appendChild(contactItem);
            });
        },

        // Generate distinctions/certifications
        generateDistinctions() {
            const distinctionsContainer = document.querySelector('.distinctions-container[data-section="distinctions"]');
            if (!distinctionsContainer) {
                console.error('Distinctions container not found');
                return;
            }
            if (!portfolioData.distinctions) {
                console.error('No distinctions data in portfolio');
                return;
            }
            
            console.log('Generating distinctions:', portfolioData.distinctions);
            distinctionsContainer.innerHTML = '';
            
            portfolioData.distinctions.forEach(distinction => {
                const distinctionItem = document.createElement('div');
                distinctionItem.className = 'distinction-item';
                distinctionItem.setAttribute('draggable', 'true');
                distinctionItem.setAttribute('data-card-id', distinction.id);
                
                const cardContent = document.createElement('div');
                cardContent.className = 'card-content';
                const iconClass = distinction.icon || 'fas fa-certificate';
                cardContent.innerHTML = `
                    <div class="distinction-header">
                        <i class="${iconClass} distinction-icon"></i>
                        <div class="distinction-info">
                            <h3 class="distinction-name">${distinction.name}</h3>
                            ${distinction.issuer ? `<p class="distinction-issuer">${distinction.issuer}</p>` : ''}
                            ${distinction.year ? `<p class="distinction-year">${distinction.year}</p>` : ''}
                        </div>
                    </div>
                `;
                distinctionItem.appendChild(cardContent);
                
                distinctionsContainer.appendChild(distinctionItem);
            });
        }
    };

    // ============================================
    // LOGS PANEL
    // ============================================
    const logs = {
        // Check if device is mobile
        isMobile() {
            return window.innerWidth <= 768;
        },

        init() {
            const logsOverlay = document.getElementById('logs-panel-overlay');
            const logsCloseBtn = document.getElementById('logs-panel-close');
            const logsSearchInput = document.getElementById('logs-search-input');
            const logsProjectList = document.getElementById('logs-project-list');
            const logsDetails = document.getElementById('logs-details');
            
            let allProjects = [];
            let filteredProjects = [];
            let selectedProjectId = null;
            
            // Open logs panel
            function openLogsPanel(projectId = null) {
                // Don't open on mobile devices
                if (logs.isMobile()) {
                    return;
                }
                
                // Check if portfolio data is available
                if (!portfolioData || !portfolioData.projects) {
                    console.warn('Portfolio data not loaded yet. Please wait...');
                    // Try to reload if data is missing
                    if (app && app.portfolio && app.portfolio.load) {
                        app.portfolio.load().then(() => {
                            // Retry opening after data loads
                            if (portfolioData && portfolioData.projects) {
                                openLogsPanel(projectId);
                            }
                        });
                    }
                    return;
                }
                
                // Ensure we have a fresh copy of projects
                allProjects = [...portfolioData.projects];
                filteredProjects = [...allProjects];
                
                renderProjectList();
                logsOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // If a project ID is provided, select it
                if (projectId) {
                    selectProject(projectId);
                }
            }
            
            // Close logs panel
            function closeLogsPanel() {
                logsOverlay.classList.remove('active');
                document.body.style.overflow = '';
                selectedProjectId = null;
                logsSearchInput.value = '';
                filteredProjects = [...allProjects];
                renderProjectList();
            }
            
            // Render project list
            function renderProjectList() {
                logsProjectList.innerHTML = '';
                
                if (filteredProjects.length === 0) {
                    logsProjectList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-family: \'JetBrains Mono\', monospace; font-size: 13px;">No projects found</div>';
                    return;
                }
                
                filteredProjects.forEach(project => {
                    const projectItem = document.createElement('div');
                    projectItem.className = `logs-project-item ${selectedProjectId === project.id ? 'active' : ''}`;
                    projectItem.setAttribute('data-project-id', project.id);
                    
                    projectItem.innerHTML = `
                        <span class="logs-project-item-status ${project.status}"></span>
                        <span class="logs-project-item-name">${project.name}</span>
                    `;
                    
                    projectItem.addEventListener('click', () => {
                        selectProject(project.id);
                    });
                    
                    logsProjectList.appendChild(projectItem);
                });
            }
            
            // Select a project
            function selectProject(projectId) {
                selectedProjectId = projectId;
                const project = allProjects.find(p => p.id === projectId);
                
                if (!project) return;
                
                // Update active state in list
                document.querySelectorAll('.logs-project-item').forEach(item => {
                    if (item.getAttribute('data-project-id') === projectId) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
                
                // Render project details
                renderProjectDetails(project);
            }
            
            // Render project details
            function renderProjectDetails(project) {
                // Safety checks for required fields
                if (!project) {
                    console.error('No project data provided');
                    return;
                }
                
                // Ensure tech array exists
                if (!project.tech || !Array.isArray(project.tech)) {
                    project.tech = [];
                }
                
                // Ensure metrics array exists (for projects that still have it)
                if (!project.metrics || !Array.isArray(project.metrics)) {
                    project.metrics = [];
                }
                
                // Ensure description exists
                if (!project.description) {
                    project.description = project.shortDescription || 'No description available.';
                }
                
                // Ensure status exists
                if (!project.status) {
                    project.status = 'online';
                }
                const techTags = (project.tech || []).map(tech => 
                    `<span class="logs-detail-tech-tag">${tech}</span>`
                ).join('');
                
                const metrics = (project.metrics || []).map(metric => `
                    <div class="logs-detail-metric">
                        <div class="logs-detail-metric-label">${metric.label}</div>
                        <div class="logs-detail-metric-value">${metric.value}</div>
                    </div>
                `).join('');
                
                logsDetails.innerHTML = `
                    <div class="logs-detail-header">
                        <div class="logs-detail-title">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                ${project.logo ? `<img src="${project.logo}" alt="${project.name}" class="logs-detail-logo">` : ``}
                                <h2>${project.name}</h2>
                                <span class="logs-detail-status ${project.status}" data-tooltip="${project.status.toUpperCase()}">
                                    <span class="logs-project-item-status ${project.status}"></span>
                                </span>
                            </div>
                            ${(project.urls && project.urls.length > 0) ? (project.urls.length === 1 ? 
                        `<a href="${project.urls[0].url}" target="_blank" rel="noopener noreferrer" class="view-project-btn"><i class="fas fa-external-link-alt"></i> View Project</a>` :
                        `<div class="view-project-dropdown">
                            <button class="view-project-btn view-project-btn-dropdown"><i class="fas fa-external-link-alt"></i> View Project <i class="fas fa-chevron-down"></i></button>
                            <div class="view-project-dropdown-menu">
                                ${project.urls.map(urlItem => `<a href="${urlItem.url}" target="_blank" rel="noopener noreferrer" class="view-project-dropdown-item">${urlItem.label || 'View Project'}</a>`).join('')}
                            </div>
                        </div>`
                    ) : ``}
                        </div>
                    </div>
                    ${project.featuredImage ? `<div class="logs-detail-featured-image"><img src="${project.featuredImage}" alt="${project.name}" /></div>` : ``}
                    <div class="logs-detail-description">
                        ${project.description || project.shortDescription || "No description available."}
                    </div>
                    <div class="logs-detail-section">
                        <div class="logs-detail-section-title">
                            <i class="fas fa-code"></i>
                            Technologies
                        </div>
                        <div class="logs-detail-tech">
                            ${techTags}
                        </div>
                    </div>
                    <div class="logs-detail-section">
                        <div class="logs-detail-section-title">
                            <i class="fas fa-info-circle"></i>
                            Details
                        </div>
                        <div class="logs-detail-preview">
                            ${(project.start_year || project.end_year) ? `<div class="logs-detail-preview-item">
                                <span class="logs-detail-preview-label">When</span>
                                <span class="logs-detail-preview-value">${project.start_year}${project.end_year ? '-' + project.end_year : ''}</span>
                            </div>` : ``}
                            ${project.company ? `<div class="logs-detail-preview-item">
                                <span class="logs-detail-preview-label">Company</span>
                                <span class="logs-detail-preview-value">${project.company}</span>
                            </div>` : ``}
                        </div>
                    </div>

                `;
            // Initialize dropdown click handlers after rendering
            setTimeout(() => {
                const dropdowns = logsDetails.querySelectorAll('.view-project-dropdown');
                dropdowns.forEach(dropdown => {
                    const button = dropdown.querySelector('.view-project-btn-dropdown');
                    if (button && !button.dataset.listenerAdded) {
                        button.dataset.listenerAdded = 'true';
                        button.addEventListener('click', (e) => {
                            e.stopPropagation();
                            dropdown.classList.toggle('active');
                            dropdowns.forEach(otherDropdown => {
                                if (otherDropdown !== dropdown) {
                                    otherDropdown.classList.remove('active');
                                }
                            });
                        });
                    }
                });
            }, 0);
            
            }
            
            // Search functionality - searches through all text fields in project data
            function handleSearch(query) {
                // Ensure we have projects data - refresh from portfolioData if needed
                if (allProjects.length === 0 && portfolioData && portfolioData.projects) {
                    allProjects = [...portfolioData.projects];
                    filteredProjects = [...allProjects];
                }
                
                // If still no projects, show message
                if (allProjects.length === 0) {
                    logsProjectList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-family: \'JetBrains Mono\', monospace; font-size: 13px;">Loading projects...</div>';
                    return;
                }
                
                const searchTerm = query.toLowerCase().trim();
                
                if (searchTerm === '') {
                    filteredProjects = [...allProjects];
                } else {
                    filteredProjects = allProjects.filter(project => {
                        // Search in name
                        if (project.name && project.name.toLowerCase().includes(searchTerm)) {
                            return true;
                        }
                        
                        // Search in description
                        if (project.description && project.description.toLowerCase().includes(searchTerm)) {
                            return true;
                        }
                        
                        // Search in shortDescription
                        if (project.shortDescription && project.shortDescription.toLowerCase().includes(searchTerm)) {
                            return true;
                        }
                        
                        // Search in company
                        if (project.company && project.company.toLowerCase().includes(searchTerm)) {
                            return true;
                        }
                        
                        // Search in status
                        if (project.status && project.status.toLowerCase().includes(searchTerm)) {
                            return true;
                        }
                        
                        // Search in tech array
                        if (project.tech && Array.isArray(project.tech)) {
                            if (project.tech.some(tech => tech.toLowerCase().includes(searchTerm))) {
                                return true;
                            }
                        }
                        
                        // Search in metrics (label and value)
                        if (project.metrics && Array.isArray(project.metrics)) {
                            if (project.metrics.some(metric => {
                                const label = metric.label ? metric.label.toLowerCase() : '';
                                const value = metric.value ? metric.value.toString().toLowerCase() : '';
                                return label.includes(searchTerm) || value.includes(searchTerm);
                            })) {
                                return true;
                            }
                        }
                        
                        // Search in URLs (label)
                        if (project.urls && Array.isArray(project.urls)) {
                            if (project.urls.some(url => {
                                const label = url.label ? url.label.toLowerCase() : '';
                                return label.includes(searchTerm);
                            })) {
                                return true;
                            }
                        }
                        
                        // Search in id
                        if (project.id && project.id.toLowerCase().includes(searchTerm)) {
                            return true;
                        }
                        
                        return false;
                    });
                }
                
                renderProjectList();
                
                // If there's a selected project and it's still in filtered results, keep it selected
                if (selectedProjectId && filteredProjects.find(p => p.id === selectedProjectId)) {
                    // Selection is maintained by renderProjectList
                } else if (filteredProjects.length > 0) {
                    // Auto-select first result if nothing is selected
                    selectProject(filteredProjects[0].id);
                } else {
                    // Clear details if no results
                    logsDetails.innerHTML = `
                        <div class="logs-empty-state">
                            <i class="fas fa-search"></i>
                            <p>No projects match your search</p>
                        </div>
                    `;

                }
            }
            
            // Event listeners
            logsSearchInput.addEventListener('input', (e) => {
                handleSearch(e.target.value);
            });
            
            logsCloseBtn.addEventListener('click', closeLogsPanel);
            logsOverlay.addEventListener('click', (e) => {
                if (e.target === logsOverlay) {
                    closeLogsPanel();
                }
            });
            
            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && logsOverlay.classList.contains('active')) {
                    closeLogsPanel();
                }
            });
            
            // Expose openLogsPanel globally
            window.openLogsPanel = openLogsPanel;
        }
    };

    // ============================================
    // INITIALIZATION
    // ============================================
    const init = {
        start() {
            // Clear any saved order for stats section (dashboard cards)
            localStorage.removeItem('card-order-stats');
            
            // Update time and set interval
            utils.updateTime();
            setInterval(() => utils.updateTime(), 1000);
            
            // Update footer stats with slight variations
            utils.updateFooterStats();
            setInterval(() => utils.updateFooterStats(), 2000); // Update every 2 seconds
            
            // Initialize modules
            theme.init();
            modals.initDelete();
            code.init();
            logs.init();
            navigation.init();
            modals.initCloseTab();
            this.initFooter();
            
            // Close dropdowns when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.view-project-dropdown')) {
                    document.querySelectorAll('.view-project-dropdown').forEach(dropdown => {
                        dropdown.classList.remove('active');
                    });
                }
            });
        },
        
        initFooter() {
            // Back to top button
            const backToTopBtn = document.getElementById('back-to-top');
            if (backToTopBtn) {
                // Show/hide button based on scroll position
                const toggleBackToTop = () => {
                    if (window.pageYOffset > 300) {
                        backToTopBtn.style.opacity = '1';
                        backToTopBtn.style.visibility = 'visible';
                    } else {
                        backToTopBtn.style.opacity = '0';
                        backToTopBtn.style.visibility = 'hidden';
                    }
                };
                
                // Initial check
                toggleBackToTop();
                
                // Listen for scroll events
                window.addEventListener('scroll', toggleBackToTop);
                
                // Scroll to top on click
                backToTopBtn.addEventListener('click', () => {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                });
            }
            
            // Footer nav links - use same scroll logic as main nav
            const footerNavLinks = document.querySelectorAll('.footer-nav-link');
            footerNavLinks.forEach(link => {
                const sectionId = link.getAttribute('data-section');
                
                // Check if the corresponding top nav link is hidden, and hide footer nav link too
                const topNavLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
                if (topNavLink && topNavLink.style.display === 'none') {
                    link.style.display = 'none';
                }
                
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    navigation.scrollToSection(sectionId);
                });
            });
            
            // Add close button event listeners
            document.querySelectorAll('.nav-close-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const sectionId = btn.getAttribute('data-section');
                    const navLink = btn.closest('.nav-link');
                    const tabName = navLink ? navLink.querySelector('.nav-path').textContent : sectionId;
                    if (window.openCloseTabModal) {
                        window.openCloseTabModal(sectionId, tabName);
                    }
                });
            });
            
            // Small delay to ensure DOM is fully ready, then load portfolio
            setTimeout(() => {
                portfolio.load();
            }, 100);
        }
    };

    // ============================================
    // PUBLIC API
    // ============================================
    return {
        utils,
        animations,
        navigation,
        theme,
        dragdrop,
        cards,
        modals,
        code,
        portfolio,
        logs,
        init
    };
})();

    // ============================================
    // TOOLTIP HANDLER
    // ============================================
    const tooltip = {
        tooltipEl: null,
        
        show(element) {
            // Check if element exists and has required properties
            if (!element || !element.getAttribute) return;
            
            const text = element.getAttribute('data-tooltip');
            if (!text) return;
            
            // Remove existing tooltip if any
            this.hide();
            
            // Create tooltip element
            this.tooltipEl = document.createElement('div');
            // Check if element has classList before using it
            const isProjectStatus = element.classList && element.classList.contains('project-status');
            this.tooltipEl.className = isProjectStatus 
                ? 'project-status-tooltip' 
                : 'logs-detail-status-tooltip';
            this.tooltipEl.textContent = text;
            document.body.appendChild(this.tooltipEl);
            
            // Get element position
            if (!element.getBoundingClientRect) return;
            const rect = element.getBoundingClientRect();
            const tooltipRect = this.tooltipEl.getBoundingClientRect();
            
            // Position tooltip above the element
            const left = rect.left + (rect.width / 2);
            const top = rect.top - tooltipRect.height - 8;
            
            this.tooltipEl.style.left = left + 'px';
            this.tooltipEl.style.top = top + 'px';
            
            // Show tooltip
            requestAnimationFrame(() => {
                if (this.tooltipEl) {
                    this.tooltipEl.classList.add('show');
                }
            });
        },
        
        hide() {
            if (this.tooltipEl) {
                this.tooltipEl.classList.remove('show');
                setTimeout(() => {
                    if (this.tooltipEl && this.tooltipEl.parentNode) {
                        this.tooltipEl.parentNode.removeChild(this.tooltipEl);
                    }
                    this.tooltipEl = null;
                }, 200);
            }
        },
        
        init() {
            // Use event delegation for dynamically created elements
            document.addEventListener('mouseenter', (e) => {
                if (!e.target) return;
                
                // Find the element with the class, even if event target is a child
                const projectStatus = e.target.closest && e.target.closest('.project-status');
                const logsDetailStatus = e.target.closest && e.target.closest('.logs-detail-status');
                
                if (projectStatus) {
                    this.show(projectStatus);
                } else if (logsDetailStatus) {
                    this.show(logsDetailStatus);
                }
            }, true);
            
            document.addEventListener('mouseleave', (e) => {
                if (!e.target) return;
                
                // Find the element with the class, even if event target is a child
                const projectStatus = e.target.closest && e.target.closest('.project-status');
                const logsDetailStatus = e.target.closest && e.target.closest('.logs-detail-status');
                
                if (projectStatus || logsDetailStatus) {
                    this.hide();
                }
            }, true);
        }
    };

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init.start();
    tooltip.init();
});

