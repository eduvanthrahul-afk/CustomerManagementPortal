/**
 * Modal & Slide-over Drawer System
 */

const Modal = {
  open(modalId) {
    const el = document.getElementById(modalId);
    if (el) {
      el.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  close(modalId) {
    const el = document.getElementById(modalId);
    if (el) {
      el.classList.remove('open');
      if (!document.querySelector('.modal-backdrop.open, .drawer-backdrop.open')) {
        document.body.style.overflow = '';
      }
    }
  },

  closeAll() {
    document.querySelectorAll('.modal-backdrop.open, .drawer-backdrop.open').forEach(el => {
      el.classList.remove('open');
    });
    document.body.style.overflow = '';
  },

  confirm(message, onConfirm, title = 'Confirm Action') {
    const modalId = 'modal-confirm-dialog';
    let modal = document.getElementById(modalId);

    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-box" style="max-width: 440px;">
          <div class="modal-header">
            <h3 class="modal-title" id="confirm-title">${title}</h3>
            <button class="btn-modal-close" onclick="Modal.close('${modalId}')">&times;</button>
          </div>
          <div class="modal-body">
            <p id="confirm-message" style="font-size: 0.9rem; color: var(--dark);">${message}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="Modal.close('${modalId}')">Cancel</button>
            <button class="btn btn-danger" id="btn-confirm-execute">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      document.getElementById('confirm-title').textContent = title;
      document.getElementById('confirm-message').textContent = message;
    }

    const btnExec = document.getElementById('btn-confirm-execute');
    btnExec.onclick = () => {
      Modal.close(modalId);
      if (typeof onConfirm === 'function') onConfirm();
    };

    Modal.open(modalId);
  }
};

// Global key listener for Escape key to close modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    Modal.closeAll();
  }
});

window.Modal = Modal;
