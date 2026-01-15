import sys
import os
import asyncio

# Añadir el directorio padre al path para poder importar server.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server import seasonal_prior_for, gbif_species_near

def test_priors():
    # Caso: Bogotá, Colombia
    lat = 4.7110
    lon = -74.0721
    date = "2024-06-15" # Junio

    print(f"--- Probando Priors Biológicos para Bogotá ({lat}, {lon}) en {date} ---")

    # 1. Especie Común: Zonotrichia capensis (Copetón)
    common_bird = "Zonotrichia capensis"
    print(f"\nAnalizando especie común: {common_bird}")
    
    # Prior Geográfico (simulado consultando si está en la lista de especies cercanas)
    # Nota: gbif_species_near devuelve una lista. Verificamos si la especie está ahí.
    # Para la prueba, reducimos el límite para hacerlo rápido, pero aumentamos size_deg para asegurar cobertura.
    print("Consultando GBIF para prior geográfico...")
    nearby_species = gbif_species_near(lat, lon, size_deg=0.1, limit=500)
    geo_prior = 1.0 if common_bird in nearby_species else 0.0
    print(f"Prior Geográfico: {geo_prior} (¿Está en la lista de {len(nearby_species)} especies cercanas?)")

    # Prior Estacional
    print("Consultando GBIF para prior estacional...")
    season_prior = seasonal_prior_for(common_bird, date, lat, lon)
    print(f"Prior Estacional: {season_prior:.4f}")

    # 2. Especie "Difícil" (Falso Positivo): Cardinalis cardinalis (Cardenal Norteño)
    # Común en USA, pero no en Bogotá.
    rare_bird = "Cardinalis cardinalis"
    print(f"\nAnalizando especie exótica (falso positivo potencial): {rare_bird}")

    geo_prior_rare = 1.0 if rare_bird in nearby_species else 0.0
    print(f"Prior Geográfico: {geo_prior_rare}")

    season_prior_rare = seasonal_prior_for(rare_bird, date, lat, lon)
    print(f"Prior Estacional: {season_prior_rare:.4f}")

    # 3. Simulación de Fusión
    print("\n--- Simulación de Fusión (Score Final) ---")
    acoustic_conf = 0.85 # Supongamos que BirdNET está 85% seguro de ambos
    
    score_common = acoustic_conf * geo_prior * season_prior
    score_rare = acoustic_conf * geo_prior_rare * season_prior_rare

    print(f"Especie: {common_bird}")
    print(f"  Confianza Acústica: {acoustic_conf}")
    print(f"  Score Final: {score_common:.4f} (Alta probabilidad)")

    print(f"Especie: {rare_bird}")
    print(f"  Confianza Acústica: {acoustic_conf}")
    print(f"  Score Final: {score_rare:.4f} (Filtrado por biología)")

if __name__ == "__main__":
    test_priors()
