import L from 'leaflet'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'

import { googleMapsUrl, type LocatedProject } from '../projection'

const BATUMI: [number, number] = [41.6458, 41.6416]

/** Numbered pin; replaces Leaflet's default image icons (which break under bundlers). */
function pinIcon(number: number, active: boolean): L.DivIcon {
  const size = active ? 34 : 28
  const style = active
    ? 'background:#49f5db;color:#00141a;border:2px solid #49f5db;box-shadow:0 0 18px #49f5db'
    : 'background:#06242a;color:#49f5db;border:2px solid rgba(73,245,219,.75);box-shadow:0 0 12px rgba(73,245,219,.45)'
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:999px;font:600 12px 'JetBrains Mono',monospace;${style}">${number}</span>`,
  })
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(Number(e.latlng.lat.toFixed(7)), Number(e.latlng.lng.toFixed(7)))
    },
  })
  return null
}

function FlyToSelected({ target }: { target: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo(target, Math.max(map.getZoom(), 15), { duration: 0.6 })
  }, [map, target])
  return null
}

/** OpenStreetMap via react-leaflet. Clicking the map sets the selected project's location when allowed. */
export default function LeafletMap({
  items,
  selectedId,
  onSelect,
  onPick,
}: {
  items: LocatedProject[]
  selectedId: number | null
  onSelect: (projectId: number) => void
  /** Present only when the user may update locations and a project is selected. */
  onPick?: (lat: number, lng: number) => void
}) {
  const { t } = useTranslation('map')
  const selected = items.find((i) => i.project.id === selectedId)
  const target = useMemo<[number, number] | null>(() => (selected ? [selected.lat, selected.lng] : null), [selected])
  const center = target ?? (items[0] ? [items[0].lat, items[0].lng] : BATUMI)

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom className="h-[520px] w-full" aria-label={t('modes.osm')}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {items.map((item) => (
        <Marker
          key={item.project.id}
          position={[item.lat, item.lng]}
          icon={pinIcon(item.number, item.project.id === selectedId)}
          eventHandlers={{ click: () => onSelect(item.project.id) }}
        >
          <Popup>
            <strong>{item.project.name}</strong>
            <br />
            {item.project.address}
            <br />
            <a href={googleMapsUrl(item.lat, item.lng)} target="_blank" rel="noopener noreferrer">
              {t('openInGoogle')}
            </a>
          </Popup>
        </Marker>
      ))}
      {onPick ? <ClickHandler onPick={onPick} /> : null}
      <FlyToSelected target={target} />
    </MapContainer>
  )
}
