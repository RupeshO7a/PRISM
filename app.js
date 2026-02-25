document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const appContainer = document.getElementById('app');
    const loginContainer = document.getElementById('login-container');
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('login-message');
    const profileForm = document.getElementById('profileForm');
    const openChangePasswordModalBtn = document.getElementById('openChangePasswordModalBtn');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const closeChangePasswordModalBtn = document.getElementById('closeChangePasswordModalBtn');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const openThemeModalBtn = document.getElementById('openThemeModalBtn');
    const themeModal = document.getElementById('themeModal');
    const closeThemeModalBtn = document.getElementById('closeThemeModalBtn');
    const themeOptions = document.querySelectorAll('.theme-option');
    const logoutBtn = document.getElementById('logoutBtn');
    let charts = {};
    let currentCasualtyData = [];
    
    Chart.register(ChartDataLabels);

    // Hardcoded weapon data
    const weaponData = {
        'Rifles': [
            { name: 'M4 Carbine', count: 500, description: 'Standard issue assault rifle.', image_url: 'https://placehold.co/100x100/A0AEC0/ffffff?text=M4' },
            { name: 'FN SCAR', count: 120, description: 'Modular assault rifle for various engagements.', image_url: 'https://placehold.co/100x100/A0AEC0/ffffff?text=SCAR' },
            { name: 'AK-47', count: 250, description: 'Reliable and durable assault rifle.', image_url: 'https://placehold.co/100x100/A0AEC0/ffffff?text=AK47' },
            { name: 'M16A4', count: 350, description: 'Classic full-sized assault rifle.', image_url: 'https://placehold.co/100x100/A0AEC0/ffffff?text=M16' },
            { name: 'HK416', count: 180, description: 'Gas piston assault rifle with high reliability.', image_url: 'https://placehold.co/100x100/A0AEC0/ffffff?text=HK416' },
        ],
        'Pistols': [
            { name: 'Beretta M9', count: 450, description: 'Standard issue sidearm.', image_url: 'https://placehold.co/100x100/A0AEC0/ffffff?text=M9' },
            { name: 'Glock 19', count: 300, description: 'Reliable polymer-framed pistol.', image_url: 'https://placehold.co/100x100/A0AEC0/ffffff?text=Glock19' },
            { name: 'SIG Sauer P320', count: 220, description: 'Modular pistol adopted by the military.', image_url: 'https://placehold.co/100x100/A0AEC0/ffffff?text=P320' },
        ],
        'Support Weapons': [
            { name: 'M249 SAW', count: 75, description: 'Light machine gun for fire support.', image_url: 'https://placehold.co/100x100/A0AEC0/ffffff?text=SAW' },
            { name: 'M240B', count: 40, description: 'Medium machine gun with high reliability.', image_url: 'https://placehold.co/100x100/A0AEC0/ffffff?text=M240B' },
            { name: 'M2 Browning', count: 15, description: 'Heavy machine gun, widely used.', image_url: 'https://placehold.co/100x100/A0AEC0/ffffff?text=M2' },
        ],
        'Explosives': [
            { name: 'M67 Grenade', count: 300, description: 'Standard fragmentation grenade.', image_url: 'https://placehold.co/100x100/A0AEC0/ffffff?text=M67' },
            { name: 'M18 Smoke Grenade', count: 150, description: 'Color smoke grenade for signaling.', image_url: 'https://placehold.co/100x100/A0AEC0/ffffff?text=M18' },
            { name: 'C4', count: 80, description: 'Plastic explosive for demolition.', image_url: 'https://placehold.co/100x100/A0AEC0/ffffff?text=C4' },
        ]
    };

    const casualtyFilters = document.getElementById('casualty-filters');

    function renderCasualtyLog(filter = 'all') {
        const logContainer = document.getElementById('casualty-log-container');
        if (!logContainer) return;
        
        const filteredData = filter === 'all' ? currentCasualtyData : currentCasualtyData.filter(d => d.status === filter);
        logContainer.innerHTML = '';

        if (filteredData.length === 0) {
            logContainer.innerHTML = `<tr><td colspan="5" class="text-center text-secondary py-4">No records found for this filter.</td></tr>`;
        } else {
            filteredData.forEach(log => {
                const statusClass = log.status === 'KIA' ? 'status-kia' : 'status-wia';
                const row = `
                    <tr>
                        <td>${new Date(log.created_at).toLocaleDateString()}</td>
                        <td>${log.soldier}</td>
                        <td>${log.unit}</td>
                        <td><span class="status-pill ${statusClass}">${log.status}</span></td>
                        <td>${log.injury}</td>
                    </tr>`;
                logContainer.innerHTML += row;
            });
        }
    }

    if (casualtyFilters) {
        casualtyFilters.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                document.querySelectorAll('#casualty-filters .filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                renderCasualtyLog(e.target.dataset.filter);
            }
        });
    }
    
    async function fetchAndRenderReports() {
        const reportsContainer = document.getElementById('reports-container');
        if (!reportsContainer) return;
        reportsContainer.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-4">Loading reports...</td></tr>`;

        const { data: reports, error } = await window.supabase
            .from('facility_reports')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error fetching reports:', error);
            if(reportsContainer) {
                reportsContainer.innerHTML = `<tr><td colspan="4" class="text-center text-red-500">Error loading reports. Please check the console.</td></tr>`;
            }
            return;
        }

        renderFacilityReports(reports);
    }

    function renderFacilityReports(reports) {
        const reportsContainer = document.getElementById('reports-container');
        if(!reportsContainer) return;

        reportsContainer.innerHTML = '';
        if (reports.length === 0) {
            reportsContainer.innerHTML = '<tr><td colspan="4" class="text-center text-secondary py-4">No facility reports found. Submit one to get started.</td></tr>';
        } else {
            reports.forEach(report => {
                const statusClass = {
                    'Pending': 'status-pending',
                    'In Progress': 'status-in-progress',
                    'Completed': 'status-completed'
                };
                const date = new Date(report.created_at).toLocaleDateString('en-US');

                const row = `
                    <tr>
                        <td>${date}</td>
                        <td>${report.issue_type}</td>
                        <td>${report.description}</td>
                        <td><span class="status-pill ${statusClass[report.status] || ''}">${report.status}</span></td>
                    </tr>
                `;
                reportsContainer.innerHTML += row;
            });
        }
    }

    window.supabase
        .channel('reports_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'facility_reports' }, payload => {
            fetchAndRenderReports();
        })
        .subscribe();
    
    window.supabase
        .channel('casualties_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'casualties' }, payload => {
            initMedicalDashboard();
        })
        .subscribe();

    function getChartData() {
        const labels = Object.keys(weaponData);
        const data = labels.map(label => {
            return weaponData[label].reduce((sum, weapon) => sum + weapon.count, 0);
        });
        
        return { labels, data };
    }

    async function fetchAmmunitionData() {
        const { data, error } = await window.supabase
            .from('ammunition_stock')
            .select('caliber, quantity_in_thousands')
            .order('caliber', { ascending: true });

        if (error) {
            console.error('Error fetching ammunition data:', error);
            return { labels: [], data: [], error: true };
        }
        
        const labels = data.map(item => item.caliber);
        const quantities = data.map(item => item.quantity_in_thousands);

        return { labels, data: quantities, error: false };
    }

    async function initArmoryCharts() {
        const weaponChartData = getChartData();
        const ammoChartData = await fetchAmmunitionData();

        if (charts.weaponChart) charts.weaponChart.destroy();
        if (charts.ammoChart) charts.ammoChart.destroy();
        
        const theme = document.body.getAttribute('data-theme');
        const textColor = theme === 'dark-steel' ? '#ffffff' : '#4a5568';


        const weaponCtx = document.getElementById('weaponChart').getContext('2d');
        charts.weaponChart = new Chart(weaponCtx, {
            type: 'doughnut',
            data: {
                labels: weaponChartData.labels,
                datasets: [{
                    label: 'Weapon Distribution',
                    data: weaponChartData.data,
                    backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'],
                    borderColor: theme === 'dark-steel' ? '#2c2c3e' : '#ffffff',
                    borderWidth: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor } }
                },
                onClick: (e, elements) => {
                    if (elements.length > 0) {
                        const clickedIndex = elements[0].index;
                        const category = charts.weaponChart.data.labels[clickedIndex];
                        showWeaponDetails(category);
                    }
                }
            }
        });

        const ammoCtx = document.getElementById('ammoChart').getContext('2d');
        if (ammoChartData.error) {
            ammoCtx.parentNode.innerHTML = '<p class="text-center text-red-500">Error loading ammunition data. Please create the `ammunition_stock` table.</p>';
        } else {
            charts.ammoChart = new Chart(ammoCtx, {
                type: 'bar',
                data: {
                    labels: ammoChartData.labels,
                    datasets: [{
                        label: 'Rounds in Stock (in thousands)',
                        data: ammoChartData.data,
                        backgroundColor: '#3B82F6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { 
                            beginAtZero: true,
                            ticks: { color: textColor },
                            grid: { color: 'rgba(128,128,128,0.2)' }
                         },
                        x: {
                            ticks: { color: textColor },
                            grid: { display: false }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        datalabels: {
                            anchor: 'end',
                            align: 'top',
                            formatter: (value) => value.toLocaleString() + 'k',
                            font: {
                                weight: 'bold'
                            },
                            color: textColor
                        }
                    }
                }
            });
        }
    }
    
    window.supabase
        .channel('ammunition_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ammunition_stock' }, payload => {
            console.log('Ammunition data changed!', payload);
            initArmoryCharts();
        })
        .subscribe();

    async function initMedicalDashboard() {
        const logContainer = document.getElementById('casualty-log-container');
        if (logContainer) {
            logContainer.innerHTML = `<tr><td colspan="5" class="text-center text-secondary py-4">Loading live casualty feed...</td></tr>`;
        }

        const { data, error } = await window.supabase.from('casualties').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error("Error fetching casualties", error);
            return;
        }
        currentCasualtyData = data;
        
        const wiaCount = currentCasualtyData.filter(d => d.status === 'WIA').length;
        const kiaCount = currentCasualtyData.filter(d => d.status === 'KIA').length;
        document.getElementById('wia-count').textContent = wiaCount;
        document.getElementById('kia-count').textContent = kiaCount;
        
        const { data: medevacData, error: medevacError } = await window.supabase.from('medevac_requests').select('id', { count: 'exact' });
        if(!medevacError) {
             document.getElementById('medevac-count').textContent = medevacData.length;
        }

        const activeFilter = document.querySelector('#casualty-filters .filter-btn.active').dataset.filter;
        renderCasualtyLog(activeFilter);

        if (charts.casualtyChart) charts.casualtyChart.destroy();
        if (charts.injuryTypeChart) charts.injuryTypeChart.destroy();

        const theme = document.body.getAttribute('data-theme');
        const textColor = theme === 'dark-steel' ? '#ffffff' : '#4a5568';
        const gridColor = theme === 'dark-steel' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        const casualtyCtx = document.getElementById('casualtyChart').getContext('2d');
        charts.casualtyChart = new Chart(casualtyCtx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Current'],
                datasets: [
                    {
                        label: 'Wounded in Action',
                        data: [15, 22, 18, 25, wiaCount], 
                        borderColor: '#F97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Killed in Action',
                        data: [2, 4, 3, 5, kiaCount], 
                        borderColor: '#DC2626',
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        ticks: { color: textColor }, 
                        grid: { color: gridColor } 
                    }, 
                    x: { 
                        ticks: { color: textColor }, 
                        grid: { color: gridColor } 
                    } 
                },
                plugins: { legend: { labels: { color: textColor } } }
            }
        });

        const injuryTypes = currentCasualtyData.reduce((acc, curr) => {
            acc[curr.injury] = (acc[curr.injury] || 0) + 1;
            return acc;
        }, {});
        
        const injuryCtx = document.getElementById('injuryTypeChart').getContext('2d');
        charts.injuryTypeChart = new Chart(injuryCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(injuryTypes),
                datasets: [{
                    label: 'Injury Types',
                    data: Object.values(injuryTypes),
                    backgroundColor: ['#EF4444', '#F59E0B', '#84CC16', '#22C55E', '#14B8A6'],
                    borderColor: theme === 'dark-steel' ? '#2c2c3e' : '#ffffff',
                    borderWidth: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: textColor } } }
            }
        });
    }

    const armoryLoginModal = document.getElementById('armoryLoginModal');
    const armoryLoginForm = document.getElementById('armoryLoginForm');
    const armoryMessage = document.getElementById('armoryMessage');
    const closeArmoryModalBtn = document.getElementById('closeArmoryModalBtn');
    const authorityIdInput = document.getElementById('authorityId');
    const togglePasswordVisibility = document.getElementById('togglePasswordVisibility');

    if (togglePasswordVisibility) {
        togglePasswordVisibility.addEventListener('click', () => {
            const currentType = authorityIdInput.getAttribute('type');
            authorityIdInput.setAttribute('type', currentType === 'password' ? 'text' : 'password');
            togglePasswordVisibility.textContent = currentType === 'password' ? 'Hide' : 'Show';
        });
    }

    if (closeArmoryModalBtn) {
        closeArmoryModalBtn.addEventListener('click', () => {
            armoryLoginModal.classList.add('hidden');
            authorityIdInput.value = '';
            authorityIdInput.setAttribute('type', 'password');
            if (togglePasswordVisibility) {
                togglePasswordVisibility.textContent = 'Show';
            }
        });
    }

    if (armoryLoginForm) {
        armoryLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const enteredId = authorityIdInput.value;
            
            const { data, error } = await window.supabase
                .from('armory_authorities')
                .select('position')
                .eq('authority_id', enteredId);

            if (error) {
                console.error('Login error:', error);
                armoryMessage.textContent = 'An error occurred. Please try again.';
                armoryMessage.classList.remove('hidden');
                return;
            }

            if (data && data.length > 0) {
                const userPosition = data[0].position;
                sessionStorage.setItem('armoryAuthorized', 'true');
                sessionStorage.setItem('armoryUserPosition', userPosition);
                armoryLoginModal.classList.add('hidden');
                switchSection('armory');

                const { error: logError } = await window.supabase
                    .from('login_history')
                    .insert([ { user_id: enteredId, login_time: new Date().toISOString(), position: userPosition } ]);

                if (logError) {
                    console.error('Failed to log login history:', logError);
                }
            } else {
                armoryMessage.textContent = 'Invalid ID. Access denied.';
                armoryMessage.classList.remove('hidden');
            }
        });
    }

    async function switchSection(targetId) {
        if (sessionStorage.getItem('isLoggedIn') !== 'true') {
            loginContainer.classList.remove('hidden');
            appContainer.classList.add('hidden');
            return;
        }

        if (targetId === 'armory') {
            const isAuthorized = sessionStorage.getItem('armoryAuthorized') === 'true';
            if (!isAuthorized) {
                armoryLoginModal.classList.remove('hidden');
                return;
            }
        }

        contentSections.forEach(section => {
            section.classList.add('hidden');
        });
        
        document.getElementById(targetId).classList.remove('hidden');

        navItems.forEach(item => {
            if (item.dataset.section === targetId) {
                item.classList.replace('nav-inactive', 'nav-active');
            } else {
                item.classList.replace('nav-active', 'nav-inactive');
            }
        });

        if (targetId === 'armory') {
            await initArmoryCharts();
        } else if (targetId === 'medical') {
            await initMedicalDashboard();
        } else if (targetId === 'settings') {
            await fetchUserProfile();
        }
    }
    
    navItems.forEach(item => {
        if (item.id !== 'logoutBtn') { // Exclude logout button from section switching
            item.addEventListener('click', (e) => {
                e.preventDefault();
                switchSection(item.dataset.section);
            });
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.clear();
            appContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
            window.location.hash = ''; // Clear the hash
        });
    }

    const reportModal = document.getElementById('reportModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const reportForm = document.getElementById('reportForm');

    if (openModalBtn) openModalBtn.addEventListener('click', () => reportModal.classList.remove('hidden'));
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => reportModal.classList.add('hidden'));
    
    window.addEventListener('click', (e) => {
        if (e.target === reportModal) {
            reportModal.classList.add('hidden');
        }
    });

    if (reportForm) {
        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newReport = {
                issue_type: e.target.issueType.value,
                location: e.target.location.value,
                status: 'Pending',
                description: e.target.description.value
            };
            
            const { error } = await window.supabase.from('facility_reports').insert([newReport]);
            
            if (error) {
                console.error('Error submitting report:', error);
                showToast("Error submitting report.", false);
            } else {
                reportModal.classList.add('hidden');
                e.target.reset();
                showToast("Report submitted successfully!");
            }
        });
    }

    const medevacModal = document.getElementById('medevacModal');
    const openMedevacModalBtn = document.getElementById('openMedevacModalBtn');
    const closeMedevacModalBtn = document.getElementById('closeMedevacModalBtn');
    const medevacForm = document.getElementById('medevacForm');

    if (openMedevacModalBtn) openMedevacModalBtn.addEventListener('click', () => medevacModal.classList.remove('hidden'));
    if (closeMedevacModalBtn) closeMedevacModalBtn.addEventListener('click', () => medevacModal.classList.add('hidden'));
    
    if (medevacForm) {
        medevacForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newRequest = {
                soldier_name: e.target.soldierName.value,
                unit: e.target.soldierUnit.value,
                injury_details: e.target.injuryDetails.value,
                urgency: e.target.urgency.value,
                status: 'Pending'
            };
            
            const { error } = await window.supabase.from('medevac_requests').insert([newRequest]);
            
            if (error) {
                console.error('Error submitting medevac request:', error);
                showToast('Failed to submit Medevac request.', false);
            } else {
                medevacModal.classList.add('hidden');
                e.target.reset();
                showToast('Medevac request submitted successfully!');
                const medevacCountEl = document.getElementById('medevac-count');
                medevacCountEl.textContent = parseInt(medevacCountEl.textContent) + 1;
            }
        });
    }

    const addCasualtyModal = document.getElementById('addCasualtyModal');
    const openAddCasualtyModalBtn = document.getElementById('openAddCasualtyModalBtn');
    const closeAddCasualtyModalBtn = document.getElementById('closeAddCasualtyModalBtn');
    const addCasualtyForm = document.getElementById('addCasualtyForm');

    if(openAddCasualtyModalBtn) openAddCasualtyModalBtn.addEventListener('click', () => addCasualtyModal.classList.remove('hidden'));
    if(closeAddCasualtyModalBtn) closeAddCasualtyModalBtn.addEventListener('click', () => addCasualtyModal.classList.add('hidden'));

    if(addCasualtyForm) {
        addCasualtyForm.addEventListener('submit', async(e) => {
            e.preventDefault();
            const newCasualty = {
                soldier: e.target.casualtySoldierName.value,
                unit: e.target.casualtySoldierUnit.value,
                status: e.target.casualtyStatus.value,
                injury: e.target.casualtyInjury.value,
            };

            const { error } = await window.supabase.from('casualties').insert([newCasualty]);

            if (error) {
                console.error('Error adding casualty:', error);
                showToast('Failed to add casualty report.', false);
            } else {
                addCasualtyModal.classList.add('hidden');
                e.target.reset();
                showToast('Casualty report added successfully!');
            }
        });
    }
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;

        const { data, error } = await window.supabase
            .from('users')
            .select('position')
            .eq('username', username)
            .eq('password', password);

        if (error) {
            console.error('Login error:', error);
            loginMessage.textContent = 'An unexpected error occurred.';
            loginMessage.classList.remove('hidden');
            return;
        }
        
        if (data && data.length > 0) {
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('username', username);
            loginContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            
            const hash = window.location.hash.replace('#', '');
            const validSections = ['facilities', 'armory', 'medical', 'settings'];
            if (hash && validSections.includes(hash)) {
                switchSection(hash);
            } else {
                switchSection('facilities');
            }
            fetchAndRenderReports();
        } else {
            loginMessage.textContent = 'Invalid username or password.';
            loginMessage.classList.remove('hidden');
        }
    });

    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const rankInput = document.getElementById('rank');
    const unitInput = document.getElementById('unit');
    const toastMessage = document.getElementById('toastMessage');

    function showToast(message, isSuccess = true) {
        toastMessage.textContent = message;
        toastMessage.style.backgroundColor = isSuccess ? '#10b981' : '#ef4444';
        toastMessage.classList.add('show');
        setTimeout(() => {
            toastMessage.classList.remove('show');
        }, 3000);
    }

    async function fetchUserProfile() {
        const username = sessionStorage.getItem('username');
        if (!username) return;


        const { data, error } = await window.supabase
            .from('user_profiles')
            .select('*')
            .eq('username', username)
            .single();

        if (error) {
            console.error('Error fetching user profile:', error);
            showToast('Failed to load profile data.', false);
            return;
        }

        if (data) {
            fullNameInput.value = data.full_name || '';
            emailInput.value = data.email || '';
            rankInput.value = data.rank || '';
            unitInput.value = data.unit || '';
        }
    }

    if(profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = sessionStorage.getItem('username');
            if (!username) return;

            const updates = {
                full_name: fullNameInput.value,
                email: emailInput.value,
                rank: rankInput.value,
                unit: unitInput.value
            };

            const { error } = await window.supabase
                .from('user_profiles')
                .update(updates)
                .eq('username', username);

            if (error) {
                console.error('Error updating profile:', error);
                showToast('Failed to update profile.', false);
            } else {
                showToast('Profile has been updated!');
            }
        });
    }

    if (openChangePasswordModalBtn) openChangePasswordModalBtn.addEventListener('click', () => changePasswordModal.classList.remove('hidden'));
    if (closeChangePasswordModalBtn) closeChangePasswordModalBtn.addEventListener('click', () => {
        changePasswordModal.classList.add('hidden');
        changePasswordForm.reset();
    });

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = e.target.currentPassword.value;
            const newPassword = e.target.newPassword.value;
            const confirmNewPassword = e.target.confirmNewPassword.value;
            const changePasswordMessage = document.getElementById('changePasswordMessage');
            const username = sessionStorage.getItem('username');

            changePasswordMessage.classList.add('hidden');

            if (newPassword !== confirmNewPassword) {
                changePasswordMessage.textContent = 'New passwords do not match.';
                changePasswordMessage.classList.remove('hidden');
                return;
            }

            const { data, error } = await window.supabase
                .from('users')
                .select('password')
                .eq('username', username)
                .single();

            if (error) {
                changePasswordMessage.textContent = 'An error occurred. Please try again.';
                changePasswordMessage.classList.remove('hidden');
                return;
            }

            if (data.password !== currentPassword) {
                changePasswordMessage.textContent = 'Incorrect current password.';
                changePasswordMessage.classList.remove('hidden');
                return;
            }
            
            const { error: updateError } = await window.supabase
                .from('users')
                .update({ password: newPassword })
                .eq('username', username);
            
            if (updateError) {
                changePasswordMessage.textContent = 'Failed to update password. Please try again.';
                changePasswordMessage.classList.remove('hidden');
                showToast('Failed to update password.', false);
            } else {
                changePasswordModal.classList.add('hidden');
                showToast('Password has been updated!');
                changePasswordForm.reset();
            }
        });
    }

    function showWeaponDetails(category) {
        const detailsSection = document.getElementById('armory-details-section');
        const detailsContainer = document.getElementById('weapon-details-container');
        const pageTitle = document.getElementById('armory-details-title');
        
        if (detailsSection && detailsContainer && pageTitle) {
            pageTitle.textContent = `${category} Inventory`;
            const weapons = weaponData[category] || [];
            
            detailsContainer.innerHTML = weapons.map(weapon => `
                <div class="flex items-center space-x-4 p-4 rounded-lg bg-primary">
                    <img src="${weapon.image_url}" alt="${weapon.name}" class="w-16 h-16 rounded-md">
                    <div>
                        <p class="text-lg font-semibold text-primary">${weapon.name}</p>
                        <p class="text-sm text-secondary">${weapon.description}</p>
                        <p class="text-sm text-secondary mt-1">Count: ${weapon.count}</p>
                    </div>
                </div>
            `).join('');

            document.getElementById('armory').classList.add('hidden');
            detailsSection.classList.remove('hidden');
        }
    }
    
    const backToArmoryBtn = document.getElementById('back-to-armory-btn');
    if (backToArmoryBtn) {
        backToArmoryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('armory-details-section').classList.add('hidden');
            document.getElementById('armory').classList.remove('hidden');
        });
    }

    const currentTheme = localStorage.getItem('theme') || 'dark-steel';
    document.body.setAttribute('data-theme', currentTheme);

    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        loginContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        const hash = window.location.hash.replace('#', '');
        const validSections = ['facilities', 'armory', 'medical', 'settings'];
        if (hash && validSections.includes(hash)) {
            switchSection(hash);
        } else {
            switchSection('facilities');
        }
        fetchAndRenderReports();
    }

    if (openThemeModalBtn) {
        openThemeModalBtn.addEventListener('click', () => {
            themeModal.classList.remove('hidden');
            const selectedTheme = localStorage.getItem('theme') || 'dark-steel';
            themeOptions.forEach(option => {
                if (option.dataset.theme === selectedTheme) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });
        });
    }

    if (closeThemeModalBtn) {
        closeThemeModalBtn.addEventListener('click', () => {
            themeModal.classList.add('hidden');
        });
    }

    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const selectedTheme = option.dataset.theme;
            localStorage.setItem('theme', selectedTheme);
            document.body.setAttribute('data-theme', selectedTheme);
            themeOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            
            // Re-render charts with new theme colors
            Object.values(charts).forEach(chart => chart.destroy());
            charts = {};
            const currentSection = document.querySelector('.content-section:not(.hidden)').id;
            if(currentSection === 'armory') initArmoryCharts();
            if(currentSection === 'medical') initMedicalDashboard();
        });
    });

    // New Roll of Honor Logic
    const viewRollOfHonorBtn = document.getElementById('viewRollOfHonorBtn');
    const backToMedicalBtn = document.getElementById('back-to-medical-btn');
    const medicalSection = document.getElementById('medical');
    const rollOfHonorSection = document.getElementById('rollOfHonor');
    const soldierDetailSection = document.getElementById('soldierDetail');
    const honorRollContainer = document.getElementById('honor-roll-container');
    const backToHonorRollBtn = document.getElementById('back-to-honor-roll-btn');

    async function showRollOfHonor() {
        const { data: kia, error } = await window.supabase
            .from('casualties')
            .select('*')
            .eq('status', 'KIA')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching KIA casualties:", error);
            showToast("Failed to load Roll of Honor.", false);
            return;
        }

        honorRollContainer.innerHTML = ''; // Clear previous entries

        if (kia.length === 0) {
            honorRollContainer.innerHTML = `<p class="text-center col-span-full text-secondary">No fallen soldiers to display at this time.</p>`;
        } else {
            kia.forEach(soldier => {
                const card = `
                <div class="honor-card cursor-pointer" data-id="${soldier.id}">
                    <img src="https://placehold.co/100x100/A0AEC0/ffffff?text=${soldier.soldier.charAt(0)}" alt="Portrait of ${soldier.soldier}" class="honor-card-img">
                    <p class="honor-card-name">${soldier.soldier}</p>
                    <p class="honor-card-unit">${soldier.unit}</p>
                    <p class="honor-card-date">Fallen on ${new Date(soldier.created_at).toLocaleDateString()}</p>
                </div>`;
                honorRollContainer.innerHTML += card;
            });
        }

        medicalSection.classList.add('hidden');
        soldierDetailSection.classList.add('hidden');
        rollOfHonorSection.classList.remove('hidden');
    }

    async function showSoldierDetails(casualtyId) {
        const { data: details, error } = await window.supabase
            .from('fallen_soldier_details')
            .select(`*, casualty:casualties(*)`)
            .eq('casualty_id', casualtyId)
            .single();

        const contentContainer = document.getElementById('soldier-detail-content');

        if (error || !details) {
            console.error("Error fetching soldier details:", error);
            const { data: basicInfo } = await window.supabase.from('casualties').select('*').eq('id', casualtyId).single();
            contentContainer.innerHTML = `
                <div class="text-center">
                    <h2 class="text-3xl font-bold text-primary">${basicInfo.soldier}</h2>
                    <p class="text-secondary mt-2">A detailed memorial has not yet been prepared for this soldier.</p>
                </div>`;
        } else {
            const soldier = details.casualty;
            let awardsHtml = '<ul><li>No awards listed.</li></ul>';
            if(details.awards && details.awards.length > 0) {
                awardsHtml = `<ul class="list-disc list-inside">` + details.awards.map(a => `<li><strong>${a.name}</strong> (${new Date(a.date).toLocaleDateString()})</li>`).join('') + `</ul>`;
            }

            let tributesHtml = '<p>No tributes yet.</p>';
            if(details.tributes && details.tributes.length > 0) {
                tributesHtml = details.tributes.map(t => `<div class="tribute-card"><p>"${t.message}"</p><p class="text-right text-sm text-secondary mt-2">- ${t.from}</p></div>`).join('');
            }
            
            let photosHtml = '<p>No photos available.</p>';
            if(details.photo_urls && details.photo_urls.length > 0) {
                photosHtml = `<div class="photo-gallery">` + details.photo_urls.map(url => `<img src="${url}" alt="Photo of ${soldier.soldier}">`).join('') + `</div>`;
            }

            contentContainer.innerHTML = `
                <div class="soldier-detail-header">
                    <img src="${details.profile_image_url || `https://placehold.co/150x150/A0AEC0/ffffff?text=${soldier.soldier.charAt(0)}`}" alt="Portrait of ${soldier.soldier}" class="soldier-profile-img">
                    <h2 class="soldier-name">${soldier.soldier}</h2>
                    <p class="soldier-info">${soldier.unit} | Fallen on ${new Date(soldier.created_at).toLocaleDateString()}</p>
                    <p class="soldier-info">Born: ${details.date_of_birth ? new Date(details.date_of_birth).toLocaleDateString() : 'N/A'} | Hometown: ${details.hometown || 'N/A'}</p>
                </div>
                <div class="space-y-8">
                    <div>
                        <h3 class="detail-section-title">Biography</h3>
                        <p class="text-[var(--text-secondary)]">${details.biography || 'No biography available.'}</p>
                    </div>
                    <div>
                        <h3 class="detail-section-title">Service Record</h3>
                        <p class="text-[var(--text-secondary)] mb-2"><strong>Branch:</strong> ${details.service_branch}</p>
                        <p class="text-[var(--text-secondary)] mb-2"><strong>Awards & Commendations:</strong></p>
                        <div class="text-[var(--text-secondary)]">${awardsHtml}</div>
                    </div>
                    <div>
                        <h3 class="detail-section-title">Tributes</h3>
                        <div class="text-[var(--text-secondary)]">${tributesHtml}</div>
                    </div>
                    <div>
                        <h3 class="detail-section-title">Photo Gallery</h3>
                        <div class="text-[var(--text-secondary)]">${photosHtml}</div>
                    </div>
                </div>
            `;
        }
        
        rollOfHonorSection.classList.add('hidden');
        soldierDetailSection.classList.remove('hidden');
    }

    if (viewRollOfHonorBtn) viewRollOfHonorBtn.addEventListener('click', showRollOfHonor);
    if (backToMedicalBtn) backToMedicalBtn.addEventListener('click', () => {
        rollOfHonorSection.classList.add('hidden');
        medicalSection.classList.remove('hidden');
    });

    if (honorRollContainer) {
        honorRollContainer.addEventListener('click', e => {
            const card = e.target.closest('.honor-card');
            if (card && card.dataset.id) {
                showSoldierDetails(card.dataset.id);
            }
        });
    }

    if(backToHonorRollBtn) backToHonorRollBtn.addEventListener('click', showRollOfHonor);
});
