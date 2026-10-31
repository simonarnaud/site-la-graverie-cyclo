// Fond de toutes les cartes du site : Plan IGN (Géoplateforme), gratuit, sans clé, couvre la France.
import L from 'leaflet';

const TUILES =
  'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2' +
  '&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';

export function fondDeCarte(): L.TileLayer {
  return L.tileLayer(TUILES, {
    maxZoom: 18,
    attribution: '© <a href="https://www.ign.fr">IGN</a> – Plan IGN',
  });
}
