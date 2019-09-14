<template>
  <div class="about">
    <div>
      <select v-if="druhyZarizeni.length" v-model="selectedDruh">
        <option v-for="druh in druhyZarizeni" :key="druh.Kod" v-bind:value="druh.Nazev">
          {{ druh.Nazev }}
        </option>
      </select>
      <select v-if="kraje.length" v-model="selectedKraj">
        <option v-for="kraj in kraje" :key="kraj.code" v-bind:value="kraj.code">
          {{ kraj.name }}
        </option>
      </select>
    </div>
    <div>
      <p>SelectedDruh: {{ selectedDruh }}</p>
      <p>SelectedKraj: {{selectedKraj}}</p>
      <p>Result count: {{ resultCount}}</p>
    </div>
    <div class="wrapper">
      <div id="map"></div>
      <div class="side-bar">
        <h1>Zemřelí podle příčin smrti</h1>
        <ul class="list no-bullets">
          <li v-for="pricina in sortedPricinyUmrti" :key="pricina.ps_kod">{{pricina.hodnota}} - {{pricina.ps_txt}}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
  import '../../node_modules/leaflet/dist/leaflet.css'
  import L from 'leaflet'
  import axios from 'axios'

  let map;

  const providerMarkerSettings = {
    mapIconUrl: '<svg xmlns="http://www.w3.org/2000/svg" class="leaflet-map-marker__pin" viewBox="0 0 24.8 34.4"><path fill="#000" class="leaflet-map-marker__path" d="M12.4 0C5.6 0 0 5.6 0 12.4c0 6.9 10.1 19.3 12.4 22 2.3-2.7 12.4-15.1 12.4-22C24.8 5.6 19.3 0 12.4 0z"/><circle fill="#fff" class="leaflet-map-marker__inner" cx="12.4" cy="12.4" r="5.7" /></svg>'
  };

  const providerIcon = L.divIcon({
    className: "leaflet-map-marker",
    html: L.Util.template(providerMarkerSettings.mapIconUrl, providerMarkerSettings),
    iconAnchor: [12, 38],
    iconSize: [28, 45],
    popupAnchor: [2, -35]
  });

  export default {
    name: 'Map',
    data() {
      return {
        druhyZarizeni: [],
        selectedDruh: null,
        kraje: [
          {code: 0, name: 'Celá ČR'},
          {code: 'CZ010', name: 'Hlavní město Praha'},
          {code: 'CZ031', name: 'Jihočeský'},
          {code: 'CZ064', name: 'Jihomoravský'},
          {code: 'CZ041', name: 'Karlovarský'},
          {code: 'CZ052', name: 'Královéhradecký'},
          {code: 'CZ051', name: 'Liberecký'},
          {code: 'CZ080', name: 'Moravskoslezský'},
          {code: 'CZ071', name: 'Olomoucký'},
          {code: 'CZ053', name: 'Pardubický'},
          {code: 'CZ032', name: 'Plzeňský'},
          {code: 'CZ020', name: 'Středočeský'},
          {code: 'CZ042', name: 'Ústecký'},
          {code: 'CZ063', name: 'Vysočina'},
          {code: 'CZ072', name: 'Zlínský'}
        ],
        selectedKraj: 0,
        resultCount: null,
        pricinyUmrti: []
      }
    },
    computed: {
      sortedPricinyUmrti: function () {
        function compare(a, b) {
          return b.hodnota - a.hodnota
        }

        return this.pricinyUmrti.sort(compare);
      }
    },
    methods: {
      initMap() {
        map = L.map('map', {
          center: [49.848055, 15.420187],
          zoom: 8
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
      },
      destroyMap() {
        if (map !== undefined) map.remove();
      },
      loadData() {
        axios.get('nrpzs.json')
            .then((response) => {
              let data = response.data;
              if (data.length) {
                let result = this.filterData(data);
                this.resultCount = result.length;
                this.drawMarkers(result)
              }
            })
      },
      filterData(data) {
        const result = [];
        data.forEach((el) => {
          let valid = true;
          if (el.DruhZarizeni !== this.selectedDruh) valid = false;
          if (this.selectedKraj !== 0) {
            if (el.KrajCode !== this.selectedKraj) valid = false;
          }
          if (valid) result.push(el)
        });
        return result;
      },
      addMarker(lat, lng, popupContent) {
        let marker = L.marker([lat, lng], {icon: providerIcon});
        if (popupContent) marker.bindPopup(popupContent);
        marker.addTo(map);
      },
      drawMarkers(objects) {
        this.destroyMap();
        this.initMap();
        if (objects.length) {
          objects.forEach((obj) => {
            if (obj.Lat === '' || obj.Lng === '') console.log('Incomplete data for: ' + obj.NazevZarizeni);
            else this.addMarker(obj.Lat, obj.Lng, obj.NazevZarizeni)
          })
        } else console.log('drawMarkers got empty markers array');
      },
      loadTableData() {
        this.pricinyUmrti = [];
        axios.get('zemreli.json')
            .then((response) => {
              console.log(response.data);
              response.data.forEach((el) => {
                if (this.selectedKraj === 0) {
                  console.log(el);
                  let kodExists = this.pricinyUmrti.find(x => x.ps_kod === el.ps_kod);
                  if (!kodExists) this.pricinyUmrti.push(el);
                  else kodExists.hodnota += el.hodnota
                } else if (el.nuts === this.selectedKraj) this.pricinyUmrti.push(el)
              })
            })
      }
    },
    watch: {
      selectedDruh() {
        this.loadData();
      },
      selectedKraj() {
        this.loadData();
        this.loadTableData();
      }
    },
    beforeCreate() {
      axios.get('https://nrpzs.uzis.cz/api/v1/druhy-zarizeni')
          .then((response) => {
            if (response.data.length) {
              this.druhyZarizeni = response.data.sort((a, b) => {
                var nameA = a.Nazev.toUpperCase();
                var nameB = b.Nazev.toUpperCase();
                if (nameA < nameB) {
                  return -1;
                }
                if (nameA > nameB) {
                  return 1;
                }
                return 0;
              });
              this.selectedDruh = this.druhyZarizeni[0].Nazev;
            } else console.log('druhyZarizeni did not load...');
          });
    },
    mounted() {
      this.loadTableData()
    }
  }

</script>

<style lang="scss">
  .wrapper {
    display: flex;
  }

  #map {
    width: 70%;
    height: 800px;
  }

  .side-bar {
    width: 30%;
    height: 800px;
    overflow-y: scroll;
  }

  .leaflet-map-marker {
    &__path {
      fill: #629bff;
    }

    &__inner {
      fill: white;
    }
  }

  .list {
    text-align: left;

    &.no-bullets {
      list-style-type: none;
    }
  }
</style>
