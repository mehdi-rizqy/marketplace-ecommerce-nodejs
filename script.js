// script.js

const API_URL = 'http://localhost:5000/api/produits';

let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Éléments du DOM
const sectionAccueil = document.getElementById('section-accueil');
const sectionTous = document.getElementById('section-tous');
const sectionPanier = document.getElementById('section-panier');
const linkAccueil = document.getElementById('link-accueil');
const linkProduits = document.getElementById('link-produits');
const linkPanier = document.getElementById('link-panier');
const pageTitle = document.getElementById('page-title');
const recentContainer = document.getElementById('recent-products');
const allContainer = document.getElementById('all-products');
const cartContainer = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const cartBadge = document.getElementById('cart-badge');
const clearCartBtn = document.getElementById('clear-cart');
const addForm = document.getElementById('add-product-form');
const editModal = new bootstrap.Modal(document.getElementById('editModal'));
const editForm = document.getElementById('edit-product-form');
const editId = document.getElementById('edit-id');
const editNom = document.getElementById('edit-nom');
const editPrix = document.getElementById('edit-prix');
const editStock = document.getElementById('edit-stock');
const editDescription = document.getElementById('edit-description');
const editUrl = document.getElementById('edit-url');
const saveEditBtn = document.getElementById('save-edit');

// Navigation
linkAccueil.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('accueil');
    setActiveLink('accueil');
});

linkProduits.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('tous');
    setActiveLink('produits');
    if (allProducts.length === 0) fetchAllProducts();
});

linkPanier.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('panier');
    setActiveLink('panier');
    displayCart();
});

function showSection(section) {
    sectionAccueil.style.display = section === 'accueil' ? 'block' : 'none';
    sectionTous.style.display = section === 'tous' ? 'block' : 'none';
    sectionPanier.style.display = section === 'panier' ? 'block' : 'none';
    if (section === 'accueil') pageTitle.textContent = '📦 Accueil';
    else if (section === 'tous') pageTitle.textContent = '📋 Tous les produits';
    else pageTitle.textContent = '🛒 Votre panier';
}

function setActiveLink(active) {
    linkAccueil.classList.toggle('active', active === 'accueil');
    linkProduits.classList.toggle('active', active === 'produits');
    linkPanier.classList.toggle('active', active === 'panier');
}

// Chargement initial
document.addEventListener('DOMContentLoaded', () => {
    fetchAllProducts();
    updateCartBadge();
});

async function fetchAllProducts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Erreur réseau');
        allProducts = await response.json();
        displayRecentProducts();
        displayAllProducts();
    } catch (error) {
        console.error(error);
        showToast('Impossible de charger les produits', 'danger');
    }
}

function displayRecentProducts() {
    const recent = [...allProducts].sort((a, b) => b.id - a.id).slice(0, 6);
    recentContainer.innerHTML = '';
    if (recent.length === 0) {
        recentContainer.innerHTML = '<div class="col-12"><div class="alert alert-info">Aucun produit récent</div></div>';
        return;
    }
    recent.forEach(product => {
        const col = document.createElement('div');
        col.className = 'col-sm-6 col-md-4 col-lg-2';
        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                ${product.url_Produit ? `<img src="${escapeHTML(product.url_Produit)}" class="card-img-top" alt="${escapeHTML(product.nom)}" style="height: 150px; object-fit: cover;">` : ''}
                <div class="card-body">
                    <h6 class="card-title">${escapeHTML(product.nom)}</h6>
                    <p class="card-text small text-muted">${escapeHTML(product.description) || '—'}</p>
                    <p class="card-text"><strong>${product.prix} €</strong></p>
                </div>
            </div>
        `;
        recentContainer.appendChild(col);
    });
}

function displayAllProducts() {
    allContainer.innerHTML = '';
    if (allProducts.length === 0) {
        allContainer.innerHTML = '<div class="col-12"><div class="alert alert-info">Aucun produit</div></div>';
        return;
    }
    allProducts.forEach(product => {
        const col = document.createElement('div');
        col.className = 'col-sm-6 col-md-4 col-lg-3';
        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                ${product.url_Produit ? `<img src="${escapeHTML(product.url_Produit)}" class="card-img-top" alt="${escapeHTML(product.nom)}" style="height: 200px; object-fit: cover;">` : '<div class="card-img-top bg-light text-center py-5">Pas d\'image</div>'}
                <div class="card-body">
                    <h5 class="card-title">${escapeHTML(product.nom)}</h5>
                    <p class="card-text text-muted small">${escapeHTML(product.description) || '—'}</p>
                    <p class="card-text"><strong>Prix :</strong> ${product.prix} €</p>
                    <p class="card-text"><strong>Stock :</strong> ${product.stock}</p>
                </div>
                <div class="card-footer bg-transparent border-0 text-end">
                    <button class="btn btn-sm btn-outline-primary edit-btn me-1" data-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn me-1" data-id="${product.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success add-to-cart-btn" data-id="${product.id}">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        `;
        allContainer.appendChild(col);
    });
    // Attacher les événements
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDelete);
    });
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', handleEdit);
    });
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', handleAddToCart);
    });
}

// Ajout au panier avec modal de quantité
function handleAddToCart(e) {
    const productId = e.currentTarget.dataset.id;
    const product = allProducts.find(p => p.id == productId);
    if (!product) return;

    // Créer un modal simple pour saisir la quantité
    const quantity = prompt(`Combien de "${product.nom}" voulez-vous ajouter ? (Stock: ${product.stock})`, '1');
    if (quantity === null) return; // Annulé
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
        showToast('Quantité invalide.', 'warning');
        return;
    }
    if (qty > product.stock) {
        showToast(`Stock insuffisant. Il reste ${product.stock} article(s).`, 'warning');
        return;
    }

    // Ajouter au panier
    const existing = cart.find(item => item.id == productId);
    if (existing) {
        existing.quantite += qty;
    } else {
        cart.push({
            id: product.id,
            nom: product.nom,
            prix: product.prix,
            quantite: qty,
            stock: product.stock
        });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    showToast(`${qty} x ${product.nom} ajouté(s) au panier.`, 'success');
}

// Mise à jour du badge du panier
function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantite, 0);
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
        
        // Ajouter une animation de secousse
        badge.classList.add('cart-badge-updated');
        setTimeout(() => {
            badge.classList.remove('cart-badge-updated');
        }, 300);
    }
}
// Affichage du panier
function displayCart() {
    if (!cartContainer) return;
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="text-muted">Votre panier est vide.</p>';
        cartTotalSpan.textContent = '0.00';
        return;
    }

    let html = '<table class="table"><thead><tr><th>Produit</th><th>Prix unitaire</th><th>Quantité</th><th>Total</th><th>Action</th></tr></thead><tbody>';
    cart.forEach((item, index) => {
        const total = item.prix * item.quantite;
        html += `<tr>
            <td>${escapeHTML(item.nom)}</td>
            <td>${item.prix} €</td>
            <td>
                <button class="btn btn-sm btn-outline-secondary decrement-qty" data-index="${index}">-</button>
                <span class="mx-2">${item.quantite}</span>
                <button class="btn btn-sm btn-outline-secondary increment-qty" data-index="${index}">+</button>
            </td>
            <td>${total.toFixed(2)} €</td>
            <td><button class="btn btn-sm btn-danger remove-item" data-index="${index}"><i class="fas fa-trash"></i></button></td>
        </tr>`;
    });
    html += '</tbody></table>';
    cartContainer.innerHTML = html;

    const total = cart.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
    cartTotalSpan.textContent = total.toFixed(2);

    // Attacher les événements des boutons du panier
    document.querySelectorAll('.decrement-qty').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.currentTarget.dataset.index;
            if (cart[index].quantite > 1) {
                cart[index].quantite--;
            } else {
                // Supprimer si quantité = 1 et on décrémente
                cart.splice(index, 1);
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartBadge();
            displayCart();
        });
    });

    document.querySelectorAll('.increment-qty').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.currentTarget.dataset.index;
            const product = allProducts.find(p => p.id == cart[index].id);
            if (cart[index].quantite < (product ? product.stock : Infinity)) {
                cart[index].quantite++;
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartBadge();
                displayCart();
            } else {
                showToast('Stock maximum atteint.', 'warning');
            }
        });
    });

    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.currentTarget.dataset.index;
            cart.splice(index, 1);
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartBadge();
            displayCart();
        });
    });
}

// Gestion du paiement
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'pay-btn') {
        const selected = document.querySelector('input[name="payment"]:checked');
        if (!selected) {
            showToast('Veuillez choisir un moyen de paiement.', 'warning');
            return;
        }
        if (cart.length === 0) {
            showToast('Votre panier est vide.', 'warning');
            return;
        }
        const total = cart.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
        const paymentMethod = selected.value;
        showToast(`Paiement de ${total.toFixed(2)} € effectué avec ${paymentMethod}. Merci !`, 'success');
        // Vider le panier
        cart = [];
        localStorage.removeItem('cart');
        updateCartBadge();
        displayCart();
        // Décocher les radios
        document.querySelectorAll('input[name="payment"]').forEach(r => r.checked = false);
    }
});

// Suppression d'un produit
async function handleDelete(e) {
    const id = e.currentTarget.dataset.id;
    if (!confirm('Supprimer ce produit ?')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.ok) {
            await fetchAllProducts();
            showToast('Produit supprimé', 'success');
        } else {
            showToast('Erreur lors de la suppression', 'danger');
        }
    } catch (error) {
        console.error(error);
        showToast('Erreur réseau', 'danger');
    }
}

// Édition : ouvrir la modale
function handleEdit(e) {
    const id = e.currentTarget.dataset.id;
    const product = allProducts.find(p => p.id == id);
    if (!product) return;

    editId.value = product.id;
    editNom.value = product.nom;
    editPrix.value = product.prix;
    editStock.value = product.stock;
    editDescription.value = product.description || '';
    editUrl.value = product.url_Produit || '';

    editModal.show();
}

// Sauvegarde de l'édition
saveEditBtn.addEventListener('click', async () => {
    const id = editId.value;
    const nom = editNom.value.trim();
    const prix = parseFloat(editPrix.value);
    const stock = parseInt(editStock.value, 10);
    const description = editDescription.value.trim();
    const url_Produit = editUrl.value.trim() || null;

    if (!nom || isNaN(prix) || prix <= 0 || isNaN(stock) || stock < 0) {
        showToast('Veuillez remplir correctement tous les champs.', 'danger');
        return;
    }

    const product = { nom, prix, description, stock, url_Produit };

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        if (response.ok) {
            editModal.hide();
            await fetchAllProducts();
            showToast('Produit mis à jour', 'success');
        } else {
            const error = await response.json();
            showToast(`Erreur : ${error.error || 'Problème'}`, 'danger');
        }
    } catch (error) {
        console.error(error);
        showToast('Erreur réseau', 'danger');
    }
});

// Ajout d'un produit (uniquement sur accueil)
if (addForm) {
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nom = document.getElementById('nom').value.trim();
        const prix = parseFloat(document.getElementById('prix').value);
        const stock = parseInt(document.getElementById('stock').value, 10);
        const description = document.getElementById('description').value.trim();
        const url_Produit = document.getElementById('url_Produit').value.trim() || null;

        if (!nom || isNaN(prix) || prix <= 0 || isNaN(stock) || stock < 0) {
            showToast('Veuillez remplir correctement tous les champs obligatoires.', 'danger');
            return;
        }

        const product = { nom, prix, description, stock, url_Produit };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
            if (response.ok) {
                addForm.reset();
                await fetchAllProducts();
                showToast('Produit ajouté avec succès !', 'success');
            } else {
                const error = await response.json();
                showToast(`Erreur : ${error.error || 'Problème'}`, 'danger');
            }
        } catch (error) {
            console.error(error);
            showToast('Erreur réseau', 'danger');
        }
    });
}

// Vider le panier
if (clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
        if (cart.length === 0) return;
        if (confirm('Vider le panier ?')) {
            cart = [];
            localStorage.removeItem('cart');
            updateCartBadge();
            displayCart();
        }
    });
}

// Fonctions utilitaires
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"]/g, function(match) {
        if (match === '&') return '&amp;';
        if (match === '<') return '&lt;';
        if (match === '>') return '&gt;';
        if (match === '"') return '&quot;';
        return match;
    });
}

function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="true" data-bs-delay="3000">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
}