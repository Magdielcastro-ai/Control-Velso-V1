#!/bin/bash
# Script para hacer push a GitHub

cd /Users/magv/Documents/Control-Velso-V1

echo "=========================================="
echo "Git Push Helper - Control Velso V1"
echo "=========================================="
echo ""
echo "Este script te ayudará a hacer push de los cambios."
echo ""

# Verificar si hay cambios para pushear
if git status | grep -q "ahead of"; then
    echo "✅ Hay cambios listos para pushear"
    echo ""
    echo "Último commit local:"
    git log --oneline -1
    echo ""
    echo "Último commit en GitHub:"
    git log --oneline origin/main -1 2>/dev/null || echo "No se pudo obtener"
    echo ""
    echo "Para hacer push, ejecuta manualmente:"
    echo ""
    echo "  cd /Users/magv/Documents/Control-Velso-V1"
    echo "  git push origin main"
    echo ""
    echo "Cuando te pida usuario: Magdielcastro-ai"
    echo "Cuando te pida password: usa tu Personal Access Token de GitHub"
    echo ""
    echo "Para crear un token, ve a: https://github.com/settings/tokens"
    echo ""
else
    echo "✅ Los cambios ya están sincronizados con GitHub"
fi

# Verificar estado de Vercel
echo ""
echo "=========================================="
echo "Estado del Deploy"
echo "=========================================="
echo ""
echo "Para verificar el estado del deploy en Vercel:"
echo "  1. Ve a https://vercel.com/dashboard"
echo "  2. Busca el proyecto 'Control-Velso-V1'"
echo "  3. Verifica que el último deploy sea exitoso"
echo ""

read -p "Presiona Enter para cerrar..."
