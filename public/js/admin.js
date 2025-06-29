import { db, storage } from './firebase-config.js';

// Admin functions
class EVAdmin {
  constructor() {
    this.initEventListeners();
    this.loadBunkLocations();
  }
  
  initEventListeners() {
    document.getElementById('add-bunk-form').addEventListener('submit', this.addBunkLocation.bind(this));
    document.getElementById('update-slots-form').addEventListener('submit', this.updateSlots.bind(this));
  }
  
  async loadBunkLocations() {
    try {
      const querySnapshot = await db.collection('bunkLocations').get();
      const bunkList = document.getElementById('bunk-list');
      bunkList.innerHTML = '';
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${data.name}</td>
          <td>${data.address}</td>
          <td>${data.totalSlots}</td>
          <td>${data.availableSlots}</td>
          <td>
            <button class="btn btn-edit" data-id="${doc.id}">Edit</button>
            <button class="btn btn-delete" data-id="${doc.id}">Delete</button>
          </td>
        `;
        bunkList.appendChild(row);
      });
      
      // Add event listeners to edit/delete buttons
      document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', this.editBunk.bind(this));
      });
      
      document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', this.deleteBunk.bind(this));
      });
      
    } catch (error) {
      console.error('Error loading bunk locations:', error);
      showMessage('Error loading bunk locations', 'error');
    }
  }
  
  async addBunkLocation(e) {
    e.preventDefault();
    const form = e.target;
    const name = form['bunk-name'].value;
    const address = form['bunk-address'].value;
    const totalSlots = parseInt(form['total-slots'].value);
    const availableSlots = parseInt(form['available-slots'].value);
    const phone = form['bunk-phone'].value;
    const photo = form['bunk-photo'].files[0];
    
    try {
      // Upload image if exists
      let photoUrl = '';
      if (photo) {
        const storageRef = storage.ref(`bunk-images/${Date.now()}_${photo.name}`);
        const snapshot = await storageRef.put(photo);
        photoUrl = await snapshot.ref.getDownloadURL();
      }
      
      // Add to Firestore
      await db.collection('bunkLocations').add({
        name,
        address,
        totalSlots,
        availableSlots,
        phone,
        photoUrl,
        coordinates: new firebase.firestore.GeoPoint(0, 0), // Will be updated with real coords
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      form.reset();
      showMessage('Bunk location added successfully', 'success');
      this.loadBunkLocations();
      
    } catch (error) {
      console.error('Error adding bunk location:', error);
      showMessage('Error adding bunk location', 'error');
    }
  }
  
  async editBunk(e) {
    const bunkId = e.target.dataset.id;
    const doc = await db.collection('bunkLocations').doc(bunkId).get();
    
    if (doc.exists) {
      const data = doc.data();
      const form = document.getElementById('edit-bunk-form');
      
      form['edit-bunk-id'].value = bunkId;
      form['edit-bunk-name'].value = data.name;
      form['edit-bunk-address'].value = data.address;
      form['edit-total-slots'].value = data.totalSlots;
      form['edit-available-slots'].value = data.availableSlots;
      form['edit-bunk-phone'].value = data.phone;
      
      // Show modal
      document.getElementById('edit-bunk-modal').style.display = 'block';
    }
  }
  
  async updateBunk(e) {
    e.preventDefault();
    const form = e.target;
    const bunkId = form['edit-bunk-id'].value;
    const name = form['edit-bunk-name'].value;
    const address = form['edit-bunk-address'].value;
    const totalSlots = parseInt(form['edit-total-slots'].value);
    const availableSlots = parseInt(form['edit-available-slots'].value);
    const phone = form['edit-bunk-phone'].value;
    const photo = form['edit-bunk-photo'].files[0];
    
    try {
      const updateData = {
        name,
        address,
        totalSlots,
        availableSlots,
        phone
      };
      
      // Upload new image if exists
      if (photo) {
        const storageRef = storage.ref(`bunk-images/${Date.now()}_${photo.name}`);
        const snapshot = await storageRef.put(photo);
        updateData.photoUrl = await snapshot.ref.getDownloadURL();
      }
      
      await db.collection('bunkLocations').doc(bunkId).update(updateData);
      
      form.reset();
      document.getElementById('edit-bunk-modal').style.display = 'none';
      showMessage('Bunk location updated successfully', 'success');
      this.loadBunkLocations();
      
    } catch (error) {
      console.error('Error updating bunk location:', error);
      showMessage('Error updating bunk location', 'error');
    }
  }
  
  async deleteBunk(e) {
    if (confirm('Are you sure you want to delete this bunk location?')) {
      const bunkId = e.target.dataset.id;
      
      try {
        await db.collection('bunkLocations').doc(bunkId).delete();
        showMessage('Bunk location deleted successfully', 'success');
        this.loadBunkLocations();
      } catch (error) {
        console.error('Error deleting bunk location:', error);
        showMessage('Error deleting bunk location', 'error');
      }
    }
  }
  
  async updateSlots(e) {
    e.preventDefault();
    const form = e.target;
    const bunkId = form['bunk-id'].value;
    const availableSlots = parseInt(form['new-available-slots'].value);
    
    try {
      await db.collection('bunkLocations').doc(bunkId).update({
        availableSlots
      });
      
      form.reset();
      showMessage('Slots updated successfully', 'success');
      this.loadBunkLocations();
    } catch (error) {
      console.error('Error updating slots:', error);
      showMessage('Error updating slots', 'error');
    }
  }
}

// Initialize admin when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('admin-dashboard')) {
    new EVAdmin();
    
    // Set up edit form submission
    document.getElementById('edit-bunk-form').addEventListener('submit', (e) => {
      e.preventDefault();
      new EVAdmin().updateBunk(e);
    });
  }
});

function showMessage(message, type) {
  const messageElement = document.getElementById('admin-message');
  messageElement.textContent = message;
  messageElement.className = `message ${type}`;
  messageElement.style.display = 'block';
  
  setTimeout(() => {
    messageElement.style.display = 'none';
  }, 5000);
}