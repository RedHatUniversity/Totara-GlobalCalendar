import React from 'react';
import BigCalendar from 'react-big-calendar';
import moment from 'moment';
import {debounce} from 'lodash';
import {requestCalendar} from '../utils/TotaraLoadGlobalCalendar';
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
      searchText      : ''
    };
  }

  componentDidMount() {
    this.setSearchParams();
    console.time('loading');
    requestCalendar(this.props.config.webservice).then((data) => {
      this.setCalendarData(data);
      console.timeEnd('loading');
    }).catch((err) => {
      console.log('ERROR!', err);
    });
  }

  setSearchParams() {
    let currentHash   = getCurrentRoute().data,
        searchRegion  = currentHash.rg || '',
        searchCountry = currentHash.cn || '',
        searchCity    = currentHash.cy || '',
        showFilters   = parseInt(currentHash.f) === 1 ? true : false;

    console.log('Passed search params: ', searchRegion, searchCountry, searchCity);
    this.setState({
      selectedRegion : searchRegion,
      selectedCountry: searchCountry,
      searchCity     : searchCity,
      showFilters    : showFilters
    });
  }

  setCalendarData(data) {
    let cleanedCalendarData = getReformattedData(data.calendar);
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
      f : nextState.showFilters ? '1' : '0'
    })
  }

  getFilteredCalendarEvents() {
    let events         = this.state.calendarData.events,
        filterMod      = this.state.selectedMoD,
        filterCategory = this.state.selectedCategory,
        filterRegion   = this.state.selectedRegion,
        filterCountry  = this.state.selectedCountry,
        filterCity     = this.state.selectedCity;

    return events.filter((evt) => {
      // let name          = evt.fullname.toLowerCase(),
      //     courseCode    = evt.shortname.toLowerCase(),
      //     summary       = evt.summary.toLowerCase(),
      //     matchFilter   = name.indexOf(filterText) >= 0 || courseCode.indexOf(filterText) >= 0 || summary.indexOf(filterText) >= 0,
      //     matchCategory = filterCategory.length ? evt.category === filterCategory : true,
      //     matchMod      = filterDelivery.length ? evt.mod === filterMod : true,

      let matchRegion  = filterRegion.length ? evt.region === filterRegion : true,
          matchCountry = filterCountry.length ? evt.country === filterCountry : true,
          matchCity    = filterCity.length ? evt.city === filterCity : true;

      return matchRegion && matchCountry && matchCity;
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
              <h1><em>Global Calendar</em> - Learning Management System for Associates</h1>
            </div>
            <p>To find events in your area, first select the&nbsp;
              <strong>region</strong>
              &nbsp;then <strong>country</strong> and <strong>city</strong>.</p>
            {this.renderFilterForm()}
            <hr/>
            <BigCalendar
              events={this.getFilteredCalendarEvents()}
              defaultDate={new Date()}
              onSelectEvent={this.selectEvent.bind(this)}
              eventPropGetter={this.getEventStyle.bind(this)}
              views={['month', 'week', 'day', 'agenda']}
            />
            <div className="calendar-legend">
              <p>Legend:
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
          </div>
        </div>);
    } else if (this.state.calendarData.raw && !this.state.calendarData.events) {
      content = <h2>There was a problem getting events for the calendar</h2>
    }

    return (<div>
      {content}
    </div>);
  }

  getEventStyle(event, start, end, isSelected) {
    let backgroundColor = '#3A017F';
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
        {/*<div className="rh-form-group text-center">*/}
        {/*<label htmlFor="mod">Delivery Mode</label>*/}
        {/*<select name="mod" ref="modSelect" className="width-50pct">*/}
        {/*<option value="" selected></option>*/}
        {/*{this.state.calendarData.mod.map((c) => {*/}
        {/*let option = <option value={c}>{c}</option>;*/}
        {/*if (c === this.state.selectedMoD) {*/}
        {/*option = <option value={c} selected>{c}</option>;*/}
        {/*}*/}
        {/*return option;*/}
        {/*})}*/}
        {/*</select>*/}
        {/*</div>*/}
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