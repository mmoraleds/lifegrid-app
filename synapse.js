// ============================================
// MAP INITIALIZATION
// ============================================
let map;
let routingControl;
let currentLat;
let currentLng;

// Get agency from URL
const urlParams = new URLSearchParams(window.location.search);
const agencyParam = urlParams.get('agency');

// ============================================
// BACK BUTTON
// ============================================
function goBackToMainWebsite() {
    window.location.href = '../main%20website/dashboard.html';
}

// ============================================
// INITIALIZE MAP
// ============================================
map = L.map('map', {
    zoomControl: true,
    fadeAnimation: true,
    zoomAnimation: true
}).setView([14.5995, 120.9842], 12);

L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    {
        attribution: '&copy; OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 19,
        minZoom: 3
    }
).addTo(map);

map.attributionControl.setPrefix('');

window.addEventListener('resize', () => map.invalidateSize());

// ============================================
// GET CURRENT LOCATION
// ============================================
function getCurrentLocation() {
    const btn = document.querySelector('.panel-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '◉ CONNECTING...';
    btn.style.opacity = '0.7';

    navigator.geolocation.getCurrentPosition(
        function(position) {
            currentLat = position.coords.latitude;
            currentLng = position.coords.longitude;
            map.setView([currentLat, currentLng], 15);

            // Cute marker - Cat paw for user
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: '🐾',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            });

            L.marker([currentLat, currentLng], { icon: customIcon })
                .addTo(map)
                .bindPopup("🐱 <b style='color:#8ffcff;'>YOU ARE HERE</b>")
                .openPopup();

            // Pulsing circle
            const circle = L.circle([currentLat, currentLng], {
                color: '#8ffcff',
                fillColor: '#8ffcff',
                fillOpacity: 0.05,
                radius: 80,
                weight: 2,
                opacity: 0.4
            }).addTo(map);

            let radius = 50;
            setInterval(() => {
                radius += 2;
                if (radius > 180) radius = 50;
                circle.setRadius(radius);
                circle.setStyle({
                    opacity: 0.4 - (radius / 400),
                    fillOpacity: 0.05 - (radius / 2000)
                });
            }, 100);

            btn.innerHTML = originalText;
            btn.style.opacity = '1';

            // Auto-search if agency param exists
            if (agencyParam) {
                const agencyMap = {
                    'SSS': 'SSS Office',
                    'PhilHealth': 'PhilHealth Office',
                    'Pag-IBIG': 'Pag-IBIG Fund',
                    'PSA': 'PSA Office',
                    'LTO': 'LTO Office',
                    'BIR': 'BIR Office'
                };
                const officeName = agencyMap[agencyParam] || agencyParam + ' Office';
                setTimeout(() => findOffice(officeName), 500);
            }
        },
        function() {
            alert("⚠️ GPS FAILED\nPlease enable location.");
            btn.innerHTML = originalText;
            btn.style.opacity = '1';
        }
    );
}

// ============================================
// HAVERSINE FORMULA
// ============================================
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================
// FIND OFFICE
// ============================================
function findOffice(destination) {
    if (currentLat === undefined) {
        alert("⚠️ Activate location first!");
        return;
    }

    const btn = document.querySelector('.panel-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '◉ SCANNING...';
    btn.style.opacity = '0.7';

    fetch("https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(destination + " Philippines") + "&limit=15")
    .then(response => response.json())
    .then(data => {
        if (data.length === 0) {
            alert("⚠️ TARGET NOT FOUND");
            btn.innerHTML = originalText;
            btn.style.opacity = '1';
            return;
        }

        let nearest = null;
        let nearestDist = Infinity;

        data.forEach(office => {
            const lat = parseFloat(office.lat);
            const lon = parseFloat(office.lon);
            const dist = getDistance(currentLat, currentLng, lat, lon);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = office;
            }
        });

        if (!nearest) {
            alert("⚠️ TARGET NOT FOUND");
            btn.innerHTML = originalText;
            btn.style.opacity = '1';
            return;
        }

        const destLat = parseFloat(nearest.lat);
        const destLng = parseFloat(nearest.lon);

        // Cute marker - Star for destination
        const destIcon = L.divIcon({
            className: 'dest-marker',
            html: '⭐',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });

        const officeName = nearest.display_name.split(',')[0];
        L.marker([destLat, destLng], { icon: destIcon })
            .addTo(map)
            .bindPopup(`
                <b style='color:#ff4de3;'>⭐ TARGET LOCKED</b><br>
                <span style='color:#8ffcff;'>${officeName}</span><br>
                <span style='color:#ff4de3;'>${nearestDist.toFixed(2)} KM</span>
            `)
            .openPopup();

        if (routingControl) map.removeControl(routingControl);

        routingControl = L.Routing.control({
            waypoints: [L.latLng(currentLat, currentLng), L.latLng(destLat, destLng)],
            routeWhileDragging: false,
            lineOptions: { 
                styles: [{ 
                    color: '#ff4de3', 
                    opacity: 0.8, 
                    weight: 4, 
                    dashArray: '8, 6' 
                }] 
            },
            showAlternatives: false,
            router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1/', profile: 'driving' })
        }).addTo(map);

        const bounds = L.latLngBounds([[currentLat, currentLng], [destLat, destLng]]);
        map.fitBounds(bounds, { padding: [60, 60] });

        btn.innerHTML = originalText;
        btn.style.opacity = '1';
    })
    .catch(error => {
        console.log(error);
        alert("⚠️ SCAN FAILED");
        btn.innerHTML = originalText;
        btn.style.opacity = '1';
    });
}

// ============================================
// AUTO-ACTIVATE
// ============================================
if (agencyParam) {
    console.log(`%c🎯 Auto-target: ${agencyParam}`, 'color: #ff4de3; font-size: 14px;');
    setTimeout(() => getCurrentLocation(), 500);
}

console.log('%c✦ LIFEGRID - KAKYA MAP ✦', 'color: #ff4de3; font-size: 18px; font-weight: bold;');
console.log('%c🐱 Cute Cyberpunk Mode Active', 'color: #8ffcff; font-size: 12px;');

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.title-letter').forEach(letter => {
        letter.setAttribute('data-text', letter.textContent);
    });
});