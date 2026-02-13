document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const pageTitle = document.getElementById('page-title');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active class from all
            navItems.forEach(nav => nav.classList.remove('active'));
            views.forEach(view => view.classList.add('hidden'));
            views.forEach(view => view.classList.remove('active'));

            // Add active class to clicked
            item.classList.add('active');

            // Show target view
            const targetId = item.getAttribute('data-target');
            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.classList.remove('hidden');
                targetView.classList.add('active');
            }

            // Update Header Title
            pageTitle.textContent = item.querySelector('span').textContent;
        });
    });

    // Calculator Logic
    const deviceSelect = document.getElementById('device-select');
    const planSelect = document.getElementById('plan-select');
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const discountRadios = document.querySelectorAll('input[name="discount"]');

    // Outputs
    const deviceMonthlyEl = document.getElementById('device-monthly');
    const planMonthlyEl = document.getElementById('plan-monthly');
    const discountAmountEl = document.getElementById('discount-amount');
    const interestAmountEl = document.getElementById('interest-amount');
    const totalMonthlyEl = document.getElementById('total-monthly');

    let state = {
        devicePrice: 0,
        planPrice: 0,
        months: 30, // Default
        discountType: 'contract' // 'contract' or 'device'
    };

    function updateCalculator() {
        const INTEREST_RATE = 0.059; // 5.9% annual interest

        // Parse inputs
        const devicePrice = parseInt(deviceSelect.value) || 0;
        const planPrice = parseInt(planSelect.value) || 0;
        const months = state.months;
        const discountType = state.discountType;

        let finalDevicePrice = devicePrice;
        let finalPlanPrice = planPrice;
        let discountAmount = 0;

        // Apply Discounts
        if (discountType === 'contract') {
            // 25% off plan
            const discount = Math.floor(planPrice * 0.25);
            finalPlanPrice = planPrice - discount;
            discountAmount = discount;
        } else {
            // Flat subsidy on device (Mock logic: 300k if > 1M, else 150k)
            const subsidy = devicePrice > 1000000 ? 300000 : 150000;
            if (devicePrice > 0) {
                finalDevicePrice = Math.max(0, devicePrice - subsidy);
                discountAmount = subsidy / months; // Show monthly equivalent impact
            }
        }

        // Installment Calculation with Interest
        // simplified for linear estimate in UI
        let deviceMonthly = 0;
        let interestMonthly = 0;

        if (devicePrice > 0) {
            deviceMonthly = Math.floor(finalDevicePrice / months);
            interestMonthly = Math.floor((finalDevicePrice * 0.059) / 12); // Monthly interest approx
        }

        const totalMonthly = deviceMonthly + finalPlanPrice + interestMonthly;

        // Update DOM
        deviceMonthlyEl.textContent = deviceMonthly.toLocaleString();
        planMonthlyEl.textContent = finalPlanPrice.toLocaleString();

        // Discount display logic
        if (discountType === 'contract') {
            discountAmountEl.textContent = discountAmount.toLocaleString() + ' (Plan 25%)';
        } else {
            discountAmountEl.textContent = Math.floor(discountAmount * months).toLocaleString() + ' (Device Total)';
        }

        interestAmountEl.textContent = interestMonthly.toLocaleString();
        totalMonthlyEl.textContent = totalMonthly.toLocaleString();
    }

    // Event Listeners
    deviceSelect.addEventListener('change', () => { updateCalculator(); });
    planSelect.addEventListener('change', () => { updateCalculator(); });

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.months = parseInt(btn.getAttribute('data-months'));
            updateCalculator();
        });
    });

    discountRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.discountType = e.target.value;
            updateCalculator();
        });
    });

    // Initial run
    updateCalculator();

    // -------------------------------------------------------------------------
    // Dashboard Map Interaction (SVG)
    // -------------------------------------------------------------------------
    const regions = document.querySelectorAll('.region');
    const regionNameDisplay = document.getElementById('region-name');
    const regionValueDisplay = document.getElementById('region-value');
    const mapTooltip = document.getElementById('map-tooltip');

    if (regions.length > 0) {
        regions.forEach(region => {
            // Hover: Show Tooltip
            region.addEventListener('mousemove', (e) => {
                const name = region.getAttribute('data-name');
                const count = region.getAttribute('data-count');

                if (mapTooltip) {
                    mapTooltip.innerHTML = `<strong>${name}</strong><br>${count} Subs`;
                    // Adjust position relative to container or mouse
                    // For simple SVG in relative container:
                    mapTooltip.style.left = e.offsetX + 20 + 'px';
                    mapTooltip.style.top = e.offsetY - 20 + 'px';
                    mapTooltip.style.opacity = 1;
                }
            });

            region.addEventListener('mouseleave', () => {
                if (mapTooltip) mapTooltip.style.opacity = 0;
            });

            // Click: Update Dashboard Header
            region.addEventListener('click', () => {
                const name = region.getAttribute('data-name');
                const count = region.getAttribute('data-count');

                // Animate change
                if (regionValueDisplay) {
                    regionValueDisplay.style.opacity = 0;
                    setTimeout(() => {
                        regionNameDisplay.textContent = name;
                        regionValueDisplay.textContent = count;
                        regionValueDisplay.style.opacity = 1;
                    }, 200);
                }

                // Highlight Effect
                regions.forEach(r => r.style.fill = ''); // Reset others
                region.style.fill = 'var(--primary)';
            });
        });
    }

    // -------------------------------------------------------------------------
    // Puzzle Map Initialization
    // -------------------------------------------------------------------------
    // Puzzle map container ID is 'puzzle-map'
    const puzzleMapEl = document.getElementById('puzzle-map');

    // UI Elements for Analytics
    const puzzleZoneName = document.getElementById('puzzle-zone-name');
    const puzzleDensityVal = document.getElementById('puzzle-density-val');
    const congestionIndicator = document.getElementById('congestion-indicator');
    const congestionText = document.getElementById('congestion-text');

    if (puzzleMapEl && typeof L !== 'undefined') {
        const puzzleMap = L.map('puzzle-map', {
            center: [37.5665, 126.9780], // Seoul Center
            zoom: 13,
            zoomControl: false,
            attributionControl: false
        });

        // Dark Tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(puzzleMap);

        let currentGrids = [];

        function renderGrids(dataType) {
            // Clear existing
            currentGrids.forEach(layer => puzzleMap.removeLayer(layer));
            currentGrids = [];

            if (typeof gridData === 'undefined' || !gridData[dataType]) return;

            gridData[dataType].forEach(item => {
                const gridSize = 0.001; // Match data scale
                const bounds = [[item.lat, item.lng], [item.lat + gridSize, item.lng + gridSize]];

                let color = '#22c55e'; // Green
                let levelClass = 'low';

                if (item.level === 'High') {
                    color = '#ef4444'; levelClass = 'high';
                } else if (item.level === 'Medium') {
                    color = '#f97316'; levelClass = 'med';
                }

                const rect = L.rectangle(bounds, {
                    color: color,
                    weight: 1,
                    fillColor: color,
                    fillOpacity: 0.35
                }).addTo(puzzleMap);

                rect.on('mouseover', function () {
                    this.setStyle({ fillOpacity: 0.7, weight: 2, color: '#fff' });

                    if (puzzleZoneName) puzzleZoneName.textContent = `Zone ${item.id}`;
                    if (puzzleDensityVal) puzzleDensityVal.textContent = item.density;

                    if (congestionIndicator) {
                        congestionIndicator.className = 'level-indicator ' + levelClass;
                    }
                    if (congestionText) congestionText.textContent = item.level;
                });

                rect.on('mouseout', function () {
                    this.setStyle({ fillOpacity: 0.35, weight: 1, color: color });
                });

                currentGrids.push(rect);
            });
        }

        // Initial Render
        renderGrids('realtime');

        // Toggle Buttons
        const toggleBtns = document.querySelectorAll('.puzzle-map-section .filter-chip');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                toggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const mode = btn.textContent.toLowerCase() === 'prediction' ? 'prediction' : 'realtime';
                renderGrids(mode);
            });
        });

        // Invalidate size on tab switch to fix rendering
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (item.getAttribute('data-target') === 'puzzle') {
                    setTimeout(() => {
                        puzzleMap.invalidateSize();
                        // Re-center on Gangnam for this data
                        puzzleMap.setView([37.498095, 127.027610], 15);
                    }, 200);
                }
            });
        });
    }
});
