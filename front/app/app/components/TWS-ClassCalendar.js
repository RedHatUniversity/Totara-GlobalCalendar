import React from 'react';
import BigCalendar from 'react-big-calendar';
import moment from 'moment';
// import { requestCalendar } from '../utils/TotaraLoadGlobalCalendar';
import {getILTCalendar} from '../utils/learningservices/shadow/ShadowDB';
import {cleanCalendarResults} from '../utils/learningservices/shadow/ParseILTCalendar';
import {getReformattedData} from '../utils/ReformatEventsForRBC';
import {getCurrentRoute, setRoute} from '../utils/HashRouter';

// CSS styles for the calendar component
import calcss from 'react-big-calendar/lib/css/react-big-calendar.css';

BigCalendar.setLocalizer(
  BigCalendar.momentLocalizer(moment)
);

class ClassCalendar extends React.Component {

  constructor() {
    super();
    this.state = {
      calendarData    : {
        raw           : null,
        events        : null,
        filteredEvents: null,
        mod           : null,
        category      : null,
        region        : null,
        country       : null,
        city          : null,
        hierarchy     : null
      },
      showFilters     : true,
      selectedMoD     : '',
      selectedCategory: '',
      selectedRegion  : '',
      selectedCountry : '',
      selectedCity    : '',
      searchText      : '',
      searchId        : ''
    };
  }

  componentDidMount() {
    this.setSearchParams();
    console.time('loading');

    getILTCalendar(this.props.config.webservice.shadowdb)
      .fork(e => {
          console.error('ERROR!', e);
        },
        r => {
          let res = cleanCalendarResults(r, this.props.config.alwaysInclude);

          this.setCalendarData(res);
          console.timeEnd('loading');
        });
  }

  setCalendarData(data) {
    let cleanedCalendarData = getReformattedData(data);

    // console.log('mod           :', cleanedCalendarData.mod);
    // console.log('category      :', cleanedCalendarData.category);
    // console.log('region        :', cleanedCalendarData.region);
    // console.log('country       :', cleanedCalendarData.country);
    // console.log('city          :', cleanedCalendarData.city);
    // console.log('hierarchy     :', cleanedCalendarData.hierarchy);

    this.setState({
      calendarData: {
        raw           : data,
        events        : cleanedCalendarData.events,
        filteredEvents: cleanedCalendarData.events,
        mod           : cleanedCalendarData.mod,
        category      : cleanedCalendarData.category,
        region        : cleanedCalendarData.region,
        country       : cleanedCalendarData.country,
        city          : cleanedCalendarData.city,
        hierarchy     : cleanedCalendarData.hierarchy
      }
    });
  }

  setSearchParams() {
    let currentHash    = getCurrentRoute().data,
        searchCategory = currentHash.ct || '',
        searchRegion   = currentHash.rg || '',
        searchCountry  = currentHash.cn || '',
        searchCity     = currentHash.cy || '',
        searchId       = currentHash.id || '',
        showFilters    = parseInt(currentHash.f) === 1 ? true : false;

    console.log('Passed search params: ', searchRegion, searchCountry, searchCity, searchCategory, searchId);
    this.setState({
      selectedRegion  : searchRegion,
      selectedCountry : searchCountry,
      selectedCity    : searchCity,
      selectedCategory: searchCategory,
      searchId        : searchId,
      showFilters     : showFilters
    });
  }

  onCategoryChange(e) {
    this.setState({selectedCategory: this.refs.categorySelect.value});
  }

  onMoDChange(e) {
    this.setState({selectedMoD: this.refs.modSelect.value});
  }

  onRegionChange(e) {
    let region  = this.refs.regionSelect.value,
        country = this.autoSelectCountry(region),
        city    = this.autoSelectCity(region, country);

    this.setState({
      selectedRegion : region,
      selectedCountry: country,
      selectedCity   : city
    });
  }

  onCountryChange(e) {
    let region  = this.refs.regionSelect.value,
        country = this.refs.countrySelect.value,
        city    = this.autoSelectCity(region, country);

    this.setState({selectedCountry: country, selectedCity: city});
  }

  onCityChange(e) {
    this.setState({selectedCity: this.refs.citySelect.value});
  }

  autoSelectCountry(region) {
    if (region.length < 1) {
      return '';
    }
    let countries = Object.keys(this.state.calendarData.hierarchy[region]);
    return countries.length === 1 ? countries[0] : '';
  }

  autoSelectCity(region, country) {
    if (region.length < 1 || country.length < 1) {
      return '';
    }
    let cities = Object.keys(this.state.calendarData.hierarchy[region][country]);
    return cities.length === 1 ? cities[0] : '';
  }

  componentWillUpdate(nextProps, nextState) {
    setRoute('/', {
      rg: nextState.selectedRegion,
      cn: nextState.selectedCountry,
      cy: nextState.selectedCity,
      ct: nextState.selectedCategory,
      id: nextState.searchId,
      f : nextState.showFilters ? '1' : '0'
    });
  }

  getFilteredCalendarEvents() {
    let events         = this.state.calendarData.events,
        filterMod      = this.state.selectedMoD,
        filterCategory = this.state.selectedCategory,
        filterRegion   = this.state.selectedRegion,
        filterCountry  = this.state.selectedCountry,
        filterCity     = this.state.selectedCity,
        filterId       = this.state.searchId;

    return events.filter((evt) => {
      let matchRegion   = filterRegion.length ? evt.region === filterRegion : true,
          matchCountry  = filterCountry.length ? evt.country === filterCountry : true,
          matchCity     = filterCity.length ? evt.city === filterCity : true,
          matchCategory = filterCategory.length ? evt.category === filterCategory : true,
          matchId       = filterId.length ? evt.courseid === parseInt(filterId) : true;
      //     matchMod      = filterDelivery.length ? evt.mod === filterMod : true,

      return matchRegion && matchCountry && matchCity && matchCategory && matchId;
    });
  }

  //----------------------------------------------------------------------------
  //  Render
  //----------------------------------------------------------------------------

  selectEvent(event) {
    console.log('selected event', event);
    window.open(event.link);
  }

  render() {
    let content = <p>Please wait, loading the calendar ...</p>;

    if (this.state.calendarData.events) {
      // console.log('events',this.state.calendarData.events);
      content = (
        <div>

          <div className="rh-calendar">
            <div className="calendar-header">
              <h1><em>Global Calendar</em> - Learning Management System for
                Associates</h1>
            </div>
            <p className="text-center">To find events in your area, first select
              the&nbsp;
              <strong>region</strong>
              &nbsp;then <strong>country</strong> and <strong>city</strong>.</p>
            <p className="text-center"><strong>Note: </strong>NHO is only
              available in <a href="#nho-classes">certain cities</a>.</p>
            {this.renderFilterForm()}
            <hr/>
            <BigCalendar
              events={this.getFilteredCalendarEvents()}
              defaultDate={new Date()}
              onSelectEvent={this.selectEvent.bind(this)}
              eventPropGetter={this.getEventStyle.bind(this)}
              views={['month']}
              popup={true}
              allDayAccessor={() => false}
            />
            <div className="calendar-legend">
              <p>Legend
                <ul>
                  <li className="cat1">Manager Development and Team Leadership
                  </li>
                  <li className="cat2">Professional Development and Individual
                    Leadership
                  </li>
                  <li className="cat3">Sales</li>
                  <li className="cat4">Technical</li>
                  <li>Uncategorized</li>
                </ul>
              </p>
            </div>
            <hr/>
            <div>
              <div className="grid-row">
                <div className="grid-col-2"></div>
                <div className="grid-col-8">
                  <h3 id="nho-classes">NHO Class Availability</h3>
                  <p>The New Hire Orientation class is only available in these
                    cities:</p>
                  <div className="grid-row">
                    <div className="grid-col-6">
                      <h5>APAC</h5>
                      <ul>
                        <li>Singapore</li>
                        <li>Beijing - Parkview Green</li>
                        <li>Beijing - Raycom</li>
                        <li>Pune</li>
                        <li>Bangalore</li>
                        <li>Tokyo</li>
                        <li>Brisbane</li>
                      </ul>
                    </div>
                    <div className="grid-col-6">
                      <h5>NA</h5>
                      <ul>
                        <li>Raleigh</li>
                      </ul>
                      <h5>EMEA</h5>
                      <ul>
                        <li>Munich</li>
                      </ul>
                      <h5>LATAM</h5>
                      <ul>
                        <li>Sao Paulo</li>
                        <li>Buenos Aires</li>
                        <li>Mexico City</li>
                        <li>Bogota</li>
                        <li>Santiago</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="grid-col-2"></div>
              </div>
            </div>
          </div>
        </div>);
    } else if (this.state.calendarData.raw && !this.state.calendarData.events) {
      content = <h2>There was a problem getting events for the calendar</h2>;
    }

    return (<div>
      {content}
    </div>);
  }

  getEventStyle(event, start, end, isSelected) {
    let backgroundColor = '#666666';
    if (event.category === 'Manager Development and Team Leadership') {
      backgroundColor = '#0B85CB';
    } else if (event.category === 'Professional Development and Individual Leadership') {
      backgroundColor = '#A2040C';
    } else if (event.category === 'Sales') {
      backgroundColor = '#429C40';
    } else if (event.category === 'Technical') {
      backgroundColor = '#374249';
    }

    return {
      style: {
        backgroundColor: backgroundColor
      }
    };
  }

  renderFilterForm() {
    let availableCities    = this.state.calendarData.city,
        availableCountries = this.state.calendarData.country,
        disableCountry     = this.state.selectedRegion.length < 1,
        disableCity        = this.state.selectedCountry.length < 1;

    if (this.state.selectedRegion.length) {
      availableCountries = Object.keys(this.state.calendarData.hierarchy[this.state.selectedRegion]);
    }
    if (this.state.selectedRegion.length && this.state.selectedCountry.length) {
      availableCities = Object.keys(this.state.calendarData.hierarchy[this.state.selectedRegion][this.state.selectedCountry]);
    }

    return (
      <div className="rh-form-inline">
        <div className="rh-form-group text-center">
          <label htmlFor="category">Category</label>
          <select name="category" ref="categorySelect" className="width-50pct"
                  onChange={this.onCategoryChange.bind(this)}>
            <option value="" selected></option>
            {this.state.calendarData.category.map((c) => {
              let option = <option value={c}>{c}</option>;
              if (c === this.state.selectedCategory) {
                option = <option value={c} selected>{c}</option>;
              }
              return option;
            })}
          </select>
        </div>
        <div className="rh-form-group text-center">
          <label htmlFor="region">Region</label>
          <select name="region" ref="regionSelect" className="width-50pct"
                  onChange={this.onRegionChange.bind(this)}>
            <option value="" selected></option>
            {this.state.calendarData.region.sort().map((c) => {
              let option = <option value={c}>{c}</option>;
              if (c === this.state.selectedRegion) {
                option = <option value={c} selected>{c}</option>;
              }
              return option;
            })}
          </select>
        </div>
        <div className="rh-form-group text-center">
          <label htmlFor="country">Country</label>
          <select name="country" ref="countrySelect" className="width-50pct"
                  onChange={this.onCountryChange.bind(this)}
                  disabled={disableCountry}>
            <option value="" selected></option>
            {availableCountries.sort().map((c) => {
              let option = <option value={c}>{c}</option>;
              if (c === this.state.selectedCountry) {
                option = <option value={c} selected>{c}</option>;
              }
              return option;
            })}
          </select>
        </div>
        <div className="rh-form-group text-center">
          <label htmlFor="city">City</label>
          <select name="city" ref="citySelect" className="width-50pct"
                  onChange={this.onCityChange.bind(this)}
                  disabled={disableCity}>
            <option value="" selected></option>
            {availableCities.sort().map((c) => {
              let option = <option value={c}>{c}</option>;
              if (c === this.state.selectedCity) {
                option = <option value={c} selected>{c}</option>;
              }
              return option;
            })}
          </select>
        </div>
        {/*<div className="rh-form-group text-center">*/}
        {/*<label htmlFor="search">Search</label>*/}
        {/*<input id="search" ref="searchField" className="width-50pct"*/}
        {/*type="text" defaultValue={this.state.searchText}/>*/}
        {/*</div>*/}
      </div>
    );
  }

}

ClassCalendar.propTypes = {
  config: React.PropTypes.object
};

export default ClassCalendar;