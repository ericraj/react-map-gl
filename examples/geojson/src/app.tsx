import * as React from 'react';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {render} from 'react-dom';
import Map, {Layer, LayerProps, Source} from 'react-map-gl';
import ControlPanel from './control-panel';
import {dataLayer} from './map-style';
import {updatePercentiles} from './utils';

const MAPBOX_TOKEN =
  'pk.eyJ1IjoiZXJpY3BtZGMiLCJhIjoiY2twN3loMWdjMDR3djJubmxtNHdsZ283aSJ9.LJ3cPW5c6J6wbVTMZYYLJA'; // Set your mapbox token here

export default function App() {
  const [year, setYear] = useState(2015);
  const [allData, setAllData] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  const [currentZone, setCurrentZone] = useState(null);

  useEffect(() => {
    /* global fetch */
    fetch(
      'https://raw.githubusercontent.com/uber/react-map-gl/master/examples/.data/us-income.geojson'
    )
      .then(resp => resp.json())
      .then(json => setAllData(json))
      .catch(err => console.error('Could not load data', err)); // eslint-disable-line
  }, []);

  const onHover = useCallback(event => {
    const {
      features,
      point: {x, y}
    } = event;
    const hoveredFeature = features && features[0];

    // prettier-ignore
    setHoverInfo(hoveredFeature && {feature: hoveredFeature, x, y});
  }, []);

  const data = useMemo(() => {
    return allData && updatePercentiles(allData, f => f.properties.income[year]);
  }, [allData, year]);

  const layerLine: LayerProps = {
    id: '__layer__line__id',
    type: 'line',
    paint: {
      'line-color': '#fff',
      'line-width': 3
    }
  };

  return (
    <>
      <Map
        initialViewState={{
          latitude: 40,
          longitude: -100,
          zoom: 3
        }}
        mapStyle="mapbox://styles/mapbox/light-v9"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={['data']}
        onMouseMove={onHover}
        onClick={ev => {
          if (data?.features?.length) {
            const currentZone = data.features.find(
              (f: GeoJSON.Feature<GeoJSON.Geometry>) =>
                f.properties.name === ev.features[0].properties.name
            );
            setCurrentZone(currentZone);
          }
        }}
      >
        <Source type="geojson" data={data}>
          <Layer {...dataLayer} />
        </Source>
        {currentZone && (
          <Source type="geojson" data={currentZone}>
            <Layer {...layerLine} />
          </Source>
        )}
        {hoverInfo && (
          <div className="tooltip" style={{left: hoverInfo.x, top: hoverInfo.y}}>
            <div>State: {hoverInfo.feature.properties.name}</div>
            <div>Median Household Income: {hoverInfo.feature.properties.value}</div>
            <div>Percentile: {(hoverInfo.feature.properties.percentile / 8) * 100}</div>
          </div>
        )}
      </Map>

      <ControlPanel year={year} onChange={value => setYear(value)} />
    </>
  );
}

export function renderToDom(container) {
  render(<App />, container);
}
