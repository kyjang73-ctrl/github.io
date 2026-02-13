document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view');
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

                // Regional Drill-down: Seoul
                if (name === 'Seoul') {
                    openSeoulDetail();
                }
            });
        });
    }

    // -------------------------------------------------------------------------
    // Seoul Detail View Logic
    // -------------------------------------------------------------------------
    const seoulDetailSection = document.getElementById('seoul-detail');
    const backToMainBtn = document.getElementById('back-to-main');
    const seoulHexMapContainer = document.getElementById('seoul-hex-map');

    function openSeoulDetail() {
        // Hide all views, Show Seoul
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        seoulDetailSection.classList.remove('hidden');
        renderSeoulHexMap();
    }

    if (backToMainBtn) {
        backToMainBtn.addEventListener('click', () => {
            seoulDetailSection.classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
        });
    }

    function renderSeoulHexMap() {
        if (!seoulHexMapContainer || seoulHexMapContainer.children.length > 0) return;

        // Mock Data for 25 Districts (Gu) - Hex Grid Layout
        // q, r coordinates for pointy-topped hexes
        const districts = [
            { id: 'gangnam', name: 'Gangnam', q: 1, r: 1, val: 1200, level: 'high' },
            { id: 'seocho', name: 'Seocho', q: 0, r: 1, val: 950, level: 'high' },
            { id: 'songpa', name: 'Songpa', q: 2, r: 1, val: 1100, level: 'high' },
            { id: 'gangdong', name: 'Gangdong', q: 3, r: 0, val: 700, level: 'med' },
            { id: 'yongsan', name: 'Yongsan', q: 0, r: 0, val: 850, level: 'med' },
            { id: 'mapo', name: 'Mapo', q: -1, r: 0, val: 890, level: 'med' },
            { id: 'seodaemun', name: 'Seodaemun', q: -2, r: 0, val: 600, level: 'med' },
            { id: 'eunpyeong', name: 'Eunpyeong', q: -2, r: -1, val: 450, level: 'low' },
            { id: 'jongno', name: 'Jongno', q: -1, r: -1, val: 550, level: 'med' },
            { id: 'jung', name: 'Jung', q: 0, r: -1, val: 500, level: 'med' },
            { id: 'seongdong', name: 'Seongdong', q: 1, r: -1, val: 780, level: 'med' },
            { id: 'gwangjin', name: 'Gwangjin', q: 2, r: -1, val: 620, level: 'med' },
            { id: 'dongdaemun', name: 'Dongdaemun', q: 1, r: -2, val: 560, level: 'med' },
            { id: 'jungnang', name: 'Jungnang', q: 2, r: -2, val: 480, level: 'low' },
            { id: 'seongbuk', name: 'Seongbuk', q: 0, r: -2, val: 510, level: 'med' },
            { id: 'gangbuk', name: 'Gangbuk', q: 0, r: -3, val: 390, level: 'low' },
            { id: 'dobong', name: 'Dobong', q: 1, r: -3, val: 350, level: 'low' },
            { id: 'nowon', name: 'Nowon', q: 2, r: -3, val: 640, level: 'med' },
            { id: 'yangcheon', name: 'Yangcheon', q: -2, r: 1, val: 680, level: 'med' },
            { id: 'gangseo', name: 'Gangseo', q: -3, r: 1, val: 720, level: 'med' },
            { id: 'guro', name: 'Guro', q: -3, r: 2, val: 690, level: 'med' },
            { id: 'geumcheon', name: 'Geumcheon', q: -2, r: 2, val: 410, level: 'low' },
            { id: 'yeongdeungpo', name: 'Yeongdeungpo', q: -1, r: 1, val: 880, level: 'high' },
            { id: 'dongjak', name: 'Dongjak', q: -1, r: 2, val: 750, level: 'med' },
            { id: 'gwanak', name: 'Gwanak', q: 0, r: 2, val: 820, level: 'high' }
        ];

        const hexSize = 35;
        const centerX = 300;
        const centerY = 250;
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", "0 0 600 500");
        svg.classList.add("hex-grid");

        districts.forEach(d => {
            // Hexagon Logic (Pointy Topped)
            const x = centerX + hexSize * (Math.sqrt(3) * d.q + Math.sqrt(3) / 2 * d.r);
            const y = centerY + hexSize * (3 / 2 * d.r);

            // Draw Hexagon Path
            const points = [];
            for (let i = 0; i < 6; i++) {
                const angle_deg = 60 * i - 30; // Pointy topped
                const angle_rad = Math.PI / 180 * angle_deg;
                points.push(`${x + hexSize * Math.cos(angle_rad)},${y + hexSize * Math.sin(angle_rad)}`);
            }

            const polygon = document.createElementNS(svgNS, "polygon");
            polygon.setAttribute("points", points.join(" "));
            polygon.setAttribute("class", `hex-path ${d.level}`);
            polygon.setAttribute("data-id", d.id);
            polygon.setAttribute("data-name", d.name);
            polygon.setAttribute("data-val", d.val);

            // Label
            const text = document.createElementNS(svgNS, "text");
            text.setAttribute("x", x);
            text.setAttribute("y", y + 4); // vertically centered approx
            text.textContent = d.name.substring(0, 3); // Abbreviation
            text.setAttribute("class", "hex-label");

            // Interaction
            polygon.addEventListener("click", () => showDistrictDetails(d));

            svg.appendChild(polygon);
            svg.appendChild(text);
        });

        seoulHexMapContainer.appendChild(svg);
    }

    function showDistrictDetails(data) {
        document.getElementById('seoul-district-name').textContent = data.name + ' District';
        document.getElementById('seoul-district-sales').textContent = data.val.toLocaleString();

        const target = 1000;
        const percent = Math.min(100, Math.round((data.val / target) * 100));

        const bar = document.getElementById('seoul-district-bar');
        document.getElementById('seoul-district-target').textContent = percent;
    }
    // -------------------------------------------------------------------------
    // Foreigner Status Dashboard Logic (KOSIS API)
    // -------------------------------------------------------------------------
    let foreignerChartInstance = null;

    function loadForeignerData() {
        const apiKey = "Y2RhYzkyNmJlOTA0OTJhZTY5ZjBhYWRkODFjYmEwYWE=";
        // 1. Fetch List of Tables (User Provided URL)
        const listUrl = `https://kosis.kr/openapi/statisticsList.do?method=getList&apiKey=${apiKey}&vwCd=MT_ZTITLE&parentListId=A32&format=json&jsonVD=Y`;

        const listContainer = document.getElementById('kosis-list');
        if (listContainer) {
            listContainer.innerHTML = '<li class="loading-spinner">Loading KOSIS Data...</li>';

            fetch(listUrl)
                .then(response => response.json())
                .then(data => {
                    listContainer.innerHTML = ''; // Clear loading
                    if (data && data.length > 0) {
                        data.forEach(item => {
                            const li = document.createElement('li');
                            li.innerHTML = `
                                <div class="dot blue"></div>
                                <div class="details">
                                    <p><strong>${item.TBL_NM}</strong></p>
                                    <span class="time">Last Updated: ${item.SEND_DE}</span>
                                </div>
                            `;
                            listContainer.appendChild(li);
                        });

                        // After list loads, load the specific chart data
                        loadChartData(apiKey);
                    } else {
                        listContainer.innerHTML = '<li>No data found.</li>';
                    }
                })
                .catch(err => {
                    console.error("KOSIS API Error:", err);
                    listContainer.innerHTML = '<li>Error loading data (CORS or Network). using Mock Data...</li>';
                    loadChartData(apiKey, true); // Fallback to mock
                });
        }
    }

    function loadChartData(apiKey, useMock = false) {
        // Table ID: DT_091_111_2009_S005A (Monthly Entrants by Nationality)
        // We want the latest month data
        const dataUrl = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${apiKey}&itmId=T1+&objL1=ALL&objL2=&objL3=&objL4=&objL5=&objL6=&objL7=&objL8=&format=json&jsonVD=Y&prdSe=M&newEstPrdCnt=1&orgId=111&tblId=DT_091_111_2009_S005A`;

        if (useMock) {
            renderForeignerChart({
                labels: ['China', 'USA', 'Japan', 'Vietnam', 'Thailand'],
                data: [145000, 89000, 76000, 45000, 32000]
            });
            return;
        }

        fetch(dataUrl)
            .then(res => res.json())
            .then(json => {
                // Process KOSIS Data
                // Structure: [{C1_NM: "Total", DT: "500000"}, {C1_NM: "China", DT: "120000"}...]
                // Filter out totals and pick top 5

                if (!json || json.length === 0) throw new Error("No Data");

                const processedData = json
                    .filter(item => item.C1_NM !== "계" && item.C1_NM !== "Total" && item.C1_NM !== "아시아주" && item.C1_NM !== "미주" && item.C1_NM !== "구주") // Exclude totals/continents
                    .map(item => ({
                        country: item.C1_NM,
                        count: parseInt(item.DT)
                    }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5); // Top 5

                renderForeignerChart({
                    labels: processedData.map(d => d.country),
                    data: processedData.map(d => d.count)
                });
            })
            .catch(err => {
                console.warn("Chart Data Fetch Failed, using Mock:", err);
                renderForeignerChart({
                    labels: ['China', 'USA', 'Japan', 'Vietnam', 'Thailand'],
                    data: [145000, 89000, 76000, 45000, 32000]
                });
            });
    }

    function renderForeignerChart(chartData) {
        const ctx = document.getElementById('foreignerChart');
        if (!ctx) return;

        if (foreignerChartInstance) {
            foreignerChartInstance.destroy();
        }

        foreignerChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Monthly Entrants',
                    data: chartData.data,
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.6)', // Blue
                        'rgba(16, 185, 129, 0.6)', // Green
                        'rgba(249, 115, 22, 0.6)', // Orange
                        'rgba(139, 92, 246, 0.6)', // Purple
                        'rgba(236, 72, 153, 0.6)'  // Pink
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(249, 115, 22, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(236, 72, 153, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }

    // Trigger load when view is active
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const targetId = item.getAttribute('data-target');
            if (targetId === 'foreigner-status') {
                loadForeignerData();
            }
        });
    });
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
