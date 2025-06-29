import { db } from './firebase-config.js';

class EVUser {
  constructor() {
    this.initEventListeners();
    this.initMap();
    this.loadNearbyBunks();
  }
  
  initEventListeners() {
    document.getElementById('search-bunks').addEventListener('click', this.searchBunks.bind(this));
    document.getElementById('book-slot-form').addEventListener('submit', this.bookSlot.bind(this));
  }
  
  initMap() {
    // Initialize Google Map
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.loadMap();
        },
        () => {
          // Default to some location if geolocation fails
          this.userLocation = { lat: 12.9716, lng: 77.5946 }; // Bangalore coordinates
          this.loadMap();
        }
      );
    } else {
      this.userLocation = { lat: 12.9716, lng: 77.5946 }; // Bangalore coordinates
      this.loadMap();
    }
  }
  
  loadMap() {
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: this.userLocation,
      zoom: 12
    });
    
    // Add user marker
    new google.maps.Marker({
      position: this.userLocation,
      map: this.map,
      title: 'Your Location',
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
      }
    });
    
    // Load bunks on map
    this.loadBunksOnMap();
  }
  
  async loadBunksOnMap() {
    try {
      const querySnapshot = await db.collection('bunkLocations')
        .where('coordinates', '!=', new firebase.firestore.GeoPoint(0, 0))
        .get();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const position = {
          lat: data.coordinates.latitude,
          lng: data.coordinates.longitude
        };
        
        const marker = new google.maps.Marker({
          position,
          map: this.map,
          title: data.name,
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
          }
        });
        
        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="bunk-info-window">
              <h3>${data.name}</h3>
              <p>${data.address}</p>
              <p>Available Slots: ${data.availableSlots}/${data.totalSlots}</p>
              <button class="btn-book" data-id="${doc.id}">Book Slot</button>
            </div>
          `
        });
        
        marker.addListener('click', () => {
          infoWindow.open(this.map, marker);
          
          // Add event listener to book button in info window
          setTimeout(() => {
            document.querySelector('.btn-book').addEventListener('click', (e) => {
              this.showBookingForm(doc.id, data);
            });
          }, 100);
        });
      });
    } catch (error) {
      console.error('Error loading bunks on map:', error);
    }
  }
  
  async loadNearbyBunks() {
    try {
      const querySnapshot = await db.collection('bunkLocations')
        .orderBy('availableSlots', 'desc')
        .limit(5)
        .get();
      
      const nearbyList = document.getElementById('nearby-bunks-list');
      nearbyList.innerHTML = '';
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const item = document.createElement('div');
        item.className = 'bunk-item';
        item.innerHTML = `
          <h3>${data.name}</h3>
          <p>${data.address}</p>
          <p>Available Slots: ${data.availableSlots}/${data.totalSlots}</p>
          <button class="btn-book" data-id="${doc.id}">Book Slot</button>
        `;
        nearbyList.appendChild(item);
      });
      
      // Add event listeners to book buttons
      document.querySelectorAll('.btn-book').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const bunkId = e.target.dataset.id;
          db.collection('bunkLocations').doc(bunkId).get()
            .then((doc) => {
              this.showBookingForm(bunkId, doc.data());
            });
        });
      });
    } catch (error) {
      console.error('Error loading nearby bunks:', error);
    }
  }
  
  async searchBunks() {
    const searchInput = document.getElementById('search-location').value;
    
    if (!searchInput) {
      alert('Please enter a location to search');
      return;
    }
    
    try {
      // Use Google Maps Geocoding API to get coordinates from address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: searchInput }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          this.map.setCenter(location);
          this.map.setZoom(14);
          
          // Search bunks near this location
          this.searchBunksNearLocation(location.lat(), location.lng());
        } else {
          alert('Location not found: ' + status);
        }
      });
    } catch (error) {
      console.error('Error searching bunks:', error);
    }
  }
  
  async searchBunksNearLocation(lat, lng) {
    try {
      // In a real app, you would use GeoFirestore for location-based queries
      // This is a simplified version that gets all bunks and filters client-side
      const querySnapshot = await db.collection('bunkLocations').get();
      const bunksList = document.getElementById('search-results');
      bunksList.innerHTML = '';
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.coordinates && data.coordinates.latitude !== 0) {
          const distance = this.calculateDistance(
            lat, lng, 
            data.coordinates.latitude, 
            data.coordinates.longitude
          );
          
          if (distance < 10) { // Within 10 km
            const item = document.createElement('div');
            item.className = 'bunk-item';
            item.innerHTML = `
              <h3>${data.name} (${distance.toFixed(1)} km)</h3>
              <p>${data.address}</p>
              <p>Available Slots: ${data.availableSlots}/${data.totalSlots}</p>
              <button class="btn-book" data-id="${doc.id}">Book Slot</button>
            `;
            bunksList.appendChild(item);
          }
        }
      });
      
      // Add event listeners to book buttons
      document.querySelectorAll('.btn-book').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const bunkId = e.target.dataset.id;
          db.collection('bunkLocations').doc(bunkId).get()
            .then((doc) => {
              this.showBookingForm(bunkId, doc.data());
            });
        });
      });
    } catch (error) {
      console.error('Error searching bunks near location:', error);
    }
  }
  
  showBookingForm(bunkId, bunkData) {
    const form = document.getElementById('book-slot-form');
    form['bunk-id'].value = bunkId;
    document.getElementById('booking-bunk-name').textContent = bunkData.name;
    document.getElementById('booking-bunk-address').textContent = bunkData.address;
    document.getElementById('booking-available-slots').textContent = 
      `${bunkData.availableSlots}/${bunkData.totalSlots}`;
    
    document.getElementById('booking-modal').style.display = 'block';
  }
  
  async bookSlot(e) {
    e.preventDefault();
    const form = e.target;
    const bunkId = form['bunk-id'].value;
    const vehicleNumber = form['vehicle-number'].value;
    const bookingTime = form['booking-time'].value;
    const userId = auth.currentUser.uid;
    
    try {
      // Get bunk data first to check available slots
      const bunkDoc = await db.collection('bunkLocations').doc(bunkId).get();
      const bunkData = bunkDoc.data();
      
      if (bunkData.availableSlots <= 0) {
        alert('No available slots at this bunk');
        return;
      }
      
      // Create booking
      const bookingRef = await db.collection('bookings').add({
        bunkId,
        bunkName: bunkData.name,
        userId,
        vehicleNumber,
        bookingTime,
        status: 'booked',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Decrement available slots
      await db.collection('bunkLocations').doc(bunkId).update({
        availableSlots: firebase.firestore.FieldValue.increment(-1)
      });
      
      form.reset();
      document.getElementById('booking-modal').style.display = 'none';
      alert(`Booking successful! Your booking ID is ${bookingRef.id}`);
      
      // Refresh data
      this.loadNearbyBunks();
      this.loadBunksOnMap();
    } catch (error) {
      console.error('Error booking slot:', error);
      alert('Error booking slot: ' + error.message);
    }
  }
  
  // Helper function to calculate distance between two coordinates in km
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }
  
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }
}

// Initialize user when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('user-dashboard')) {
    new EVUser();
  }
});