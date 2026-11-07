const state = { products: [], cart: JSON.parse(localStorage.getItem("tm-cart") || "[]"), wishlist: JSON.parse(localStorage.getItem("tm-wishlist") || "[]"), category: "All", query: "" };
const $ = (id) => document.getElementById(id);
const money = (n) => "GH₵" + Number(n).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const safe = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
let toastTimer;
function toast(message) { const el=$("toast"); el.textContent=message; el.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),2500); }
async function api(url, options={}) {
  const response = await fetch(url, { headers: { "Content-Type":"application/json", ...(options.headers||{}) }, ...options });
  const data = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
function persist() { localStorage.setItem("tm-cart", JSON.stringify(state.cart)); localStorage.setItem("tm-wishlist", JSON.stringify(state.wishlist)); updateCartCount(); }
function updateCartCount() { $("cartCount").textContent = state.cart.reduce((n,x)=>n+x.quantity,0); }
async function loadProducts() {
  $("productGrid").innerHTML='<div class="loading">Loading products...</div>';
  try {
    const params = new URLSearchParams();
    if(state.query) params.set("q",state.query);
    if(state.category!=="All") params.set("category",state.category);
    state.products = await api("/api/products?"+params.toString());
    renderProducts();
  } catch(e) { $("productGrid").innerHTML='<div class="empty">Could not load products. Please refresh the page.</div>'; }
}
function renderProducts() {
  const grid=$("productGrid");
  if(!state.products.length){grid.innerHTML='<div class="empty">No products found. Try another search or category.</div>';return;}
  grid.innerHTML=state.products.map(p=>{
    const discount=p.oldPrice>p.price?Math.round((1-p.price/p.oldPrice)*100):0;
    return `<article class="product-card">
      <div class="product-image"><img src="${safe(p.image)}" alt="${safe(p.name)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'">
      ${discount?`<span class="discount">-${discount}%</span>`:""}
      <button class="wish ${state.wishlist.includes(p.id)?"selected":""}" data-wish="${p.id}" aria-label="Add to wishlist">${state.wishlist.includes(p.id)?"♥":"♡"}</button></div>
      <div class="product-info"><div class="product-name">${safe(p.name)}</div><div class="seller-name">Sold by ${safe(p.seller)}</div>
      <div class="rating">★ ${Number(p.rating||0).toFixed(1)} <span style="color:#89958d"> · ${p.stock} in stock</span></div>
      <div class="price-row"><span class="price">${money(p.price)}</span>${p.oldPrice>p.price?`<span class="old-price">${money(p.oldPrice)}</span>`:""}</div>
      <div class="wholesale-note">Wholesale from ${p.wholesaleMin||1} units</div><button class="add-btn" data-add="${p.id}">＋ Add to cart</button></div>
    </article>`;
  }).join("");
}
function addToCart(id) {
  const p=state.products.find(x=>x.id===id) || state.allProducts?.find(x=>x.id===id);
  if(!p){toast("Product not found. Refresh and try again.");return;}
  const item=state.cart.find(x=>x.id===id);
  if(item)item.quantity++;else state.cart.push({id:p.id,name:p.name,price:p.price,image:p.image,quantity:1});
  persist(); renderCart(); toast("Added to your cart");
}
function cartTotal(){return state.cart.reduce((n,x)=>n+x.price*x.quantity,0);}
function renderCart(){
  const el=$("cartItems");
  if(!state.cart.length){el.innerHTML='<div class="empty">Your cart is empty.<br>Find something you love.</div>';}
  else el.innerHTML=state.cart.map(x=>`<div class="cart-item"><img src="${safe(x.image)}" alt=""><div><b>${safe(x.name)}</b><small>${money(x.price)} each</small><div class="qty"><button data-qty="${x.id}" data-change="-1">−</button><span>${x.quantity}</span><button data-qty="${x.id}" data-change="1">+</button></div><button class="remove" data-remove="${x.id}">Remove</button></div><strong>${money(x.price*x.quantity)}</strong></div>`).join("");
  $("cartTotal").textContent=money(cartTotal()); $("checkoutTotal").textContent=money(cartTotal());
}
function openDrawer(){ $("overlay").classList.add("show"); $("cartDrawer").classList.add("open"); renderCart(); }
function closeAll(){ $("overlay").classList.remove("show"); $("cartDrawer").classList.remove("open"); document.querySelectorAll(".modal").forEach(x=>x.classList.remove("open")); }
function openModal(id){ $("overlay").classList.add("show"); $(id).classList.add("open"); }
document.addEventListener("click",e=>{
  const add=e.target.closest("[data-add]"); if(add){addToCart(Number(add.dataset.add));return;}
  const wish=e.target.closest("[data-wish]"); if(wish){const id=Number(wish.dataset.wish);state.wishlist=state.wishlist.includes(id)?state.wishlist.filter(x=>x!==id):[...state.wishlist,id];persist();renderProducts();toast(state.wishlist.includes(id)?"Saved to wishlist":"Removed from wishlist");return;}
  const qty=e.target.closest("[data-qty]"); if(qty){const item=state.cart.find(x=>x.id===Number(qty.dataset.qty));if(item){item.quantity+=Number(qty.dataset.change);if(item.quantity<=0)state.cart=state.cart.filter(x=>x.id!==item.id);persist();renderCart();}return;}
  const remove=e.target.closest("[data-remove]");if(remove){state.cart=state.cart.filter(x=>x.id!==Number(remove.dataset.remove));persist();renderCart();return;}
  const cat=e.target.closest("[data-category]");if(cat){state.category=cat.dataset.category;state.query="";$("searchInput").value="";document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x.dataset.filter===state.category));loadProducts();$("products").scrollIntoView({behavior:"smooth"});return;}
  if(e.target.closest("[data-close]")){closeAll();}
});
$("overlay").addEventListener("click",closeAll);
$("cartBtn").addEventListener("click",openDrawer);
$("checkoutBtn").addEventListener("click",()=>{if(!state.cart.length){toast("Your cart is empty");return;}closeAll();openModal("checkoutModal");});
$("accountBtn").addEventListener("click",()=>openModal("accountModal"));
$("wishlistBtn").addEventListener("click",()=>{state.category="All";state.query="";loadProducts().then(()=>{state.products=state.products.filter(p=>state.wishlist.includes(p.id));renderProducts();$("products").scrollIntoView({behavior:"smooth"});});});
$("openSeller").addEventListener("click",()=>openModal("sellerModal"));
$("allCategories").addEventListener("click",()=>$("nav").classList.toggle("open"));
$("mobileMenu").addEventListener("click",()=>$("nav").classList.toggle("open"));
$("searchForm").addEventListener("submit",e=>{e.preventDefault();state.query=$("searchInput").value.trim();state.category=$("searchCategory").value;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x.dataset.filter===state.category));loadProducts();$("products").scrollIntoView({behavior:"smooth"});});
document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{state.category=b.dataset.filter;state.query="";$("searchInput").value="";document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));loadProducts();}));
$("checkoutForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!state.cart.length){toast("Your cart is empty");return;}
  const form=Object.fromEntries(new FormData(e.target).entries());
  try{const order=await api("/api/orders",{method:"POST",body:JSON.stringify({...form,items:state.cart.map(x=>({id:x.id,quantity:x.quantity}))})});state.cart=[];persist();closeAll();e.target.reset();renderCart();toast("Order "+order.id+" received. Thank you!");}
  catch(err){toast(err.message);}
});
$("sellerForm").addEventListener("submit",async e=>{
  e.preventDefault();const form=Object.fromEntries(new FormData(e.target).entries());
  try{await api("/api/products",{method:"POST",body:JSON.stringify(form)});closeAll();e.target.reset();state.category="All";state.query="";await loadProducts();$("products").scrollIntoView({behavior:"smooth"});toast("Product published to the demo marketplace");}
  catch(err){toast(err.message);}
});
$("newsletterForm").addEventListener("submit",e=>{e.preventDefault();e.target.reset();toast("Thanks! Newsletter signup needs an email service connection.");});
$("year").textContent=new Date().getFullYear();
persist();renderCart();loadProducts();
