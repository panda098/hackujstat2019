<template>
  <div class="about">
    <div class="select__wrapper">
      <span class="select__label">Kraj:</span>
      <div class="select">
        <select v-if="kraje.length" v-model="code">
          <option v-for="kraj in kraje" :key="kraj.code" v-bind:value="kraj.code">
            {{ kraj.name }}
          </option>
        </select>
      </div>
    </div>
    <div class="wrapper">
      <div class="side-bar">
        <h4 class="subtitle">Druhy zdrav. zařízení</h4>
        <label v-for="druh in sortedDruhyZarizeni" :key="druh.DruhZarizeni" :for="druh.DruhZarizeni">
          <input type="radio" :id="druh.DruhZarizeni" :value="druh.DruhZarizeni" v-model="selectedDruh">
          {{druh.DruhZarizeni}} ({{druh.count}})<br>
        </label>
      </div>
      <div id="map"></div>
      <div class="side-bar">
        <div class="accord">
          <h4 class="subtitle accord__heading" @click="toggleMaxHeight">Zemřelí podle příčin smrti</h4>
          <ul class="list no-bullets">
            <li v-for="pricina in sortedPricinyUmrti" :key="pricina.ps_kod">{{pricina.hodnota}} - {{pricina.ps_txt}}
            </li>
          </ul>
        </div>
        <div class="accord">
          <h4 class="subtitle accord__heading" @click="toggleMaxHeight">Počet vyplacených dávek nem. pojištění</h4>
          <strong>Ženy</strong>
          <ul class="list no-bullets">
            <li v-for="dnp in filteredDnpFemale">
              <span v-if="dnp">{{dnp.typ}}: {{dnp.pocet}}</span>
            </li>
          </ul>
          <strong>Muži</strong>
          <ul class="list no-bullets">
            <li v-for="dnp in filteredDnpMale">
              <span v-if="dnp">{{dnp.typ}}: {{dnp.pocet}}</span>
            </li>
          </ul>
        </div>
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
          {code: 0, name: 'Celá ČR', coords: [49.848055, 15.420187], zoom: 8},
          {code: 'CZ010', name: 'Hlavní město Praha', coords: [50.071264, 14.437391], zoom: 11},
          {code: 'CZ031', name: 'Jihočeský', coords: [49.226516, 14.415662], zoom: 9},
          {code: 'CZ064', name: 'Jihomoravský', coords: [49.194765, 16.596130], zoom: 9},
          {code: 'CZ041', name: 'Karlovarský', coords: [50.186150, 12.670732], zoom: 10},
          {code: 'CZ052', name: 'Královéhradecký', coords: [50.431095, 15.797707], zoom: 9},
          {code: 'CZ051', name: 'Liberecký', coords: [50.697994, 14.956836], zoom: 10},
          {code: 'CZ080', name: 'Moravskoslezský', coords: [49.896519, 18.081143], zoom: 9},
          {code: 'CZ071', name: 'Olomoucký', coords: [49.890226, 17.212439], zoom: 9},
          {code: 'CZ053', name: 'Pardubický', coords: [49.951090, 16.162581], zoom: 9},
          {code: 'CZ032', name: 'Plzeňský', coords: [49.652327, 13.291962], zoom: 9},
          {code: 'CZ020', name: 'Středočeský', coords: [50.071264, 14.437391], zoom: 9},
          {code: 'CZ042', name: 'Ústecký', coords: [50.632912, 13.793330], zoom: 9},
          {code: 'CZ063', name: 'Vysočina', coords: [49.395749, 15.589568], zoom: 9},
          {code: 'CZ072', name: 'Zlínský', coords: [49.220510, 17.664979], zoom: 9}
        ],
        resultCount: null,
        pricinyUmrti: [],
        dnp: []
      }
    },
    computed: {
      code: {
        get() {
          return this.$store.state.krajCode
        },
        set(code) {
          this.$store.commit('setKrajCode', code)
        }
      },
      sortedDruhyZarizeni: function () {
        function compare(a, b) {
          return b.count - a.count
        }

        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        return this.druhyZarizeni.sort(compare);
      },
      sortedPricinyUmrti: function () {
        function compare(a, b) {
          return b.hodnota - a.hodnota
        }

        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        return this.pricinyUmrti.sort(compare);
      },
      filteredDnpFemale() {
        return this.getDnpBySex('F')
      },
      filteredDnpMale() {
        return this.getDnpBySex('M')
      }
    },
    methods: {
      getDnpBySex(pohlavi) {
        if (this.$store.state.krajCode === 0) {
          let result = [];
          this.dnp.forEach((el) => {
            if (el) {
              let elExist = result.find(x => x.typ === el.typ && x.pohlavi === pohlavi);
              if (elExist) elExist.pocet += el.pocet;
              else if (el.pohlavi === pohlavi) result.push(el)
            }
          });
          return result;
        } else return this.dnp.map((el) => {
          if (el && el.krajCode === this.$store.state.krajCode && el.pohlavi === pohlavi) return el
        })
      },
      initMap() {
        document.getElementById('map').innerHTML = "<div id='map'></div>";
        map = L.map('map', {
          center: [49.848055, 15.420187],
          zoom: 8
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
      },
      destroyMap() {
        if (map) map.remove();
      },
      initData() {
        this.druhyZarizeni = [];
        this.selectedDruh = null;
        this.destroyMap();
        axios.get('nrpzs.json')
            .then((response) => {
              response.data.forEach((el) => {
                if (el) {
                  if (el.KrajCode === this.$store.state.krajCode || this.$store.state.krajCode === 0) {
                    let elExist = this.druhyZarizeni.find(x => x.DruhZarizeni === el.DruhZarizeni);
                    if (elExist) elExist.count++;
                    else this.druhyZarizeni.push({
                      DruhZarizeni: el.DruhZarizeni,
                      count: 1
                    });
                  }
                }
              });
              this.initMap()
            })
      },
      updateMarkers() {
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
          if (this.$store.state.krajCode !== 0) {
            if (el.KrajCode !== this.$store.state.krajCode) valid = false;
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
        if (objects.length) {
          this.destroyMap();
          this.initMap();
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
              response.data.forEach((el) => {
                if (this.$store.state.krajCode === 0) {
                  let kodExists = this.pricinyUmrti.find(x => x.ps_kod === el.ps_kod);
                  if (!kodExists) this.pricinyUmrti.push(el);
                  else kodExists.hodnota += el.hodnota
                } else if (el.nuts === this.$store.state.krajCode) this.pricinyUmrti.push(el)
              })
            })
      },
      loadDnp() {
        this.dnp = [];
        axios.get('dnp.json')
            .then((response) => {
              response.data.forEach((el) => {
                let elExist = this.dnp.find(x => x.krajCode === el.nuts && x.pohlavi === el.pohlavi_kod && x.typ === el.typ_dnp);
                if (elExist) elExist.pocet += parseInt(el.pocet_dnp);
                else this.dnp.push({
                  krajCode: el.nuts,
                  pohlavi: el.pohlavi_kod,
                  typ: el.typ_dnp,
                  pocet: parseInt(el.pocet_dnp)
                })
              });
            })
      },
      toggleMaxHeight(e) {
        e.target.parentElement.classList.toggle('full-height')
      }
    },
    watch: {
      selectedDruh(value) {
        if (value) this.updateMarkers();
      }
    },
    mounted() {
      if (!this.code) this.$store.commit('setKrajCode', 0);
      this.$store.watch(
          (state) => {
            return state.krajCode
          },
          () => {
            this.initData();
            this.loadTableData();
            this.loadDnp()
          }
      );
      this.initData();
      this.loadTableData();
      this.loadDnp()
    },
    destroyed() {
      map = undefined;
    }
  }

</script>

<style lang="scss">
  .select {
    &__wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 10px;
    }

    &__label {
      font-size: 20px;
      margin-right: 15px;
    }
  }

  .wrapper {
    display: flex;
  }

  #map {
    width: 50%;
    height: 800px;
  }

  .side-bar {
    width: 25%;
    padding: 10px;
    height: 800px;
    overflow-y: auto;
    text-align: left;
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
    border: none;
    box-shadow: none;

    &.no-bullets {
      list-style-type: none;
      padding-left: 10px;
    }
  }

  .accord {
    height: 230px;
    overflow: hidden;
    margin-bottom: 10px;
    position: relative;

    &:after {
      position: absolute;
      content: '+';
      top: -2px;
      right: 15px;
      font-size: 20px;
    }

    &.full-height {
      height: auto;

      &:after {
        content: '-';
      }
    }

    &__heading {
      text-decoration: underline;
      margin-bottom: 10px !important;
      padding-right: 30px;

      &:hover {
        text-decoration: none;
        cursor: pointer;
      }
    }
  }
</style>
