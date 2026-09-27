document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/index.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Update Title
        if (data.title) {
            document.getElementById('hero-title').textContent = data.title;
            document.title = `${data.title} - Software Systems Design Project`;
        }

        // Update Tags
        if (data.tags && Array.isArray(data.tags)) {
            const tagsContainer = document.getElementById('hero-tags');
            tagsContainer.innerHTML = ''; // clear loading state if any
            data.tags.forEach(tag => {
                const span = document.createElement('span');
                span.className = 'tag';
                span.textContent = tag;
                tagsContainer.appendChild(span);
            });
        }

        // Update Team
        if (data.team && Array.isArray(data.team)) {
            const teamGrid = document.getElementById('team-grid');
            teamGrid.innerHTML = ''; // clear placeholder
            
            data.team.forEach(member => {
                // Generate initials for avatar
                let initials = "TM";
                if (member.name) {
                    const nameParts = member.name.split(' ').filter(n => n.length > 0);
                    if (nameParts.length >= 2) {
                        initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
                    } else if (nameParts.length === 1) {
                        initials = nameParts[0].substring(0, 2).toUpperCase();
                    }
                }
                
                const card = document.createElement('div');
                card.className = 'team-card';
                
                card.innerHTML = `
                    <div class="avatar-placeholder">${initials}</div>
                    <h3>${member.name || 'Team Member'}</h3>
                    <span class="enumber">${member.eNumber || 'E/YY/XXX'}</span>
                    <a href="mailto:${member.email}" class="email">${member.email || 'email@eng.pdn.ac.lk'}</a>
                `;
                teamGrid.appendChild(card);
            });
        }

    } catch (error) {
        console.error("Could not load project data:", error);
        document.getElementById('hero-title').textContent = "Wedak.lk Project";
    }
});
