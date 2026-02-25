const calculateValue = (price, stock) => {
    if (price < 0 || stock < 0) return 0;
    return price * stock;
};

// Valida si hay suficiente stock disponible
const hasStock = (stock) => {
    return stock > 0;
};

// Aplica un descuento al precio
const applyDiscount = (price, discountPercent) => {
    if (discountPercent < 0 || discountPercent > 100) return price;
    return price - (price * discountPercent) / 100;
};

module.exports = { calculateValue, hasStock, applyDiscount };