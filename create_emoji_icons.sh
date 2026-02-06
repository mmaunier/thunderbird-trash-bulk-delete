#!/bin/bash
# Script pour convertir l'emoji 🗑️ en icônes PNG
# Utilise différentes méthodes selon les outils disponibles

set -e

EMOJI="🗑️"
OUTPUT_DIR="addon/icons"
SIZES=(16 32 48 64 128)

mkdir -p "$OUTPUT_DIR"

echo "Création d'icônes à partir de l'emoji : $EMOJI"
echo ""

# Méthode 1 : Utiliser pango-view (le meilleur pour les emojis)
if command -v pango-view &> /dev/null; then
    echo "✓ Utilisation de pango-view (méthode recommandée)"
    echo ""
    
    for size in "${SIZES[@]}"; do
        output_file="$OUTPUT_DIR/trash-$size.png"
        
        # Calculer la taille de police pour remplir l'image
        font_size=$((size * 72 / 96))  # Conversion pixels -> points
        
        # Créer une image temporaire avec pango-view
        temp_file="$OUTPUT_DIR/temp-$size.png"
        
        echo "$EMOJI" | pango-view --font="Noto Color Emoji $font_size" \
            --output="$temp_file" \
            --background=transparent \
            -q /dev/stdin
        
        # Redimensionner et centrer avec ImageMagick en préservant la transparence
        if command -v magick &> /dev/null; then
            magick "$temp_file" -background none -resize ${size}x${size} \
                -gravity center -background none -extent ${size}x${size} \
                "$output_file"
        else
            mv "$temp_file" "$output_file"
        fi
        
        rm -f "$temp_file"
        echo "✓ Créé : $output_file (${size}x${size})"
    done
    
    echo ""
    echo "✅ Terminé ! ${#SIZES[@]} icônes créées avec pango-view"
    exit 0
fi

# Méthode 2 : Utiliser librsvg avec un SVG contenant l'emoji
if command -v rsvg-convert &> /dev/null; then
    echo "✓ Utilisation de rsvg-convert avec SVG"
    echo ""
    
    # Créer un SVG temporaire avec l'emoji
    svg_file="$OUTPUT_DIR/temp-emoji.svg"
    
    for size in "${SIZES[@]}"; do
        # Créer un SVG avec l'emoji et fond transparent
        cat > "$svg_file" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 $size $size">
  <rect width="$size" height="$size" fill="none" opacity="0"/>
  <text x="50%" y="50%" font-family="Noto Color Emoji" 
        font-size="${size}px" text-anchor="middle" 
        dominant-baseline="central">$EMOJI</text>
</svg>
EOF
        
        output_file="$OUTPUT_DIR/trash-$size.png"
        rsvg-convert -w $size -h $size -b none "$svg_file" -o "$output_file" 2>/dev/null || true
        
        if [ -f "$output_file" ]; then
            echo "✓ Créé : $output_file (${size}x${size})"
        else
            echo "✗ Échec : $output_file"
        fi
    done
    
    rm -f "$svg_file"
    echo ""
    echo "⚠️  SVG avec emoji peut ne pas fonctionner parfaitement"
    echo "   Installez pango-view pour de meilleurs résultats :"
    echo "   sudo pacman -S pango"
    exit 0
fi

# Méthode 3 : Utiliser Cairo avec Python
if command -v python3 &> /dev/null; then
    echo "✓ Tentative avec Python + Cairo"
    echo ""
    
    python3 << 'PYTHON_SCRIPT'
import sys
try:
    import cairo
    import gi
    gi.require_version('PangoCairo', '1.0')
    gi.require_version('Pango', '1.0')
    from gi.repository import Pango, PangoCairo
    
    EMOJI = "🗑️"
    SIZES = [16, 32, 64]
    OUTPUT_DIR = "addon/icons"
    
    for size in SIZES:
        # Créer une surface Cairo
        surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, size, size)
        context = cairo.Context(surface)
        
        # Fond transparent
        context.set_source_rgba(0, 0, 0, 0)
        context.paint()
        
        # Créer le layout Pango
        layout = PangoCairo.create_layout(context)
        font_size = int(size * 0.875 * 1024)  # En unités Pango
        font_desc = Pango.FontDescription(f"Noto Color Emoji {size}")
        layout.set_font_description(font_desc)
        layout.set_text(EMOJI, -1)
        
        # Centrer le texte
        ink_rect, logical_rect = layout.get_pixel_extents()
        x = (size - logical_rect.width) // 2 - logical_rect.x
        y = (size - logical_rect.height) // 2 - logical_rect.y
        
        context.move_to(x, y)
        PangoCairo.show_layout(context, layout)
        
        # Sauvegarder
        output_file = f"{OUTPUT_DIR}/trash-{size}.png"
        surface.write_to_png(output_file)
        print(f"✓ Créé : {output_file} ({size}x{size})")
    
    print("\n✅ Terminé avec Python + Cairo!")
    sys.exit(0)
    
except ImportError as e:
    print(f"✗ Modules Python manquants : {e}")
    print("  Installation : sudo pacman -S python-cairo python-gobject")
    sys.exit(1)
PYTHON_SCRIPT
    
    if [ $? -eq 0 ]; then
        exit 0
    fi
fi

# Aucune méthode n'a fonctionné
echo "❌ Aucune méthode disponible pour convertir l'emoji"
echo ""
echo "Solutions :"
echo "  1. Installer pango-view (recommandé) :"
echo "     sudo pacman -S pango"
echo ""
echo "  2. Installer librsvg :"
echo "     sudo pacman -S librsvg"
echo ""
echo "  3. Installer Python Cairo :"
echo "     sudo pacman -S python-cairo python-gobject"
echo ""
echo "En attendant, utilisez les icônes Lucide avec :"
echo "  ./download_icons.sh"

exit 1
