import React from 'react';
import {capitalizeFirstLetterStr} from '../../../../shared/utils/Toolbox';
/*
 let sample = {
 headers: [
 {content: 'Col 1', sorted: 0, className: ''},
 {content: 'Col 2', sorted: 0, className: ''}
 ],
 data   : [
 [
 {content: 'Row 1, cell 1', link: '', newWindow: true},
 {content: 'Row 1, cell 2', link: '', newWindow: true}
 ],
 [
 {content: 'Row 2, cell 1', link: '', newWindow: true},
 {content: 'Row 2, cell 2', link: '', newWindow: true}
 ]
 ]
 };
 */

class DataTable extends React.Component {

  constructor() {
    super();
    // TODO what can be moved from state to a var?
    this.state = {tableData: null};
  }

  componentWillReceiveProps(nextProps) {
    this.copyPropsToState(nextProps);
  }

  // direction: -1 asc, 1 dec
  sortColumn(idx, direction) {
    let workingState = this.state.tableData;

    // Headers
    workingState.headers.map((header, i) => {
      if (i === idx) {
        header.sorted = direction;
      } else {
        header.sorted = 0;
      }
    });

    // Data
    workingState.data.sort((one, two) => {
      let a      = one[idx].content,
          b      = two[idx].content,
          result = 0;
      if (direction === 1) {
        result = a < b ? -1 : a > b ? 1 : 0;
      } else {
        result = a < b ? 1 : a > b ? -1 : 0;
      }
      return result;
    });

    this.setState({tableData: workingState});
  }


  componentDidMount() {
    this.copyPropsToState();
  }

  // TODO fix this bad function
  copyPropsToState(nextProps) {
    let newData;
    if (this.props.data && !this.props.jsonData) {
      newData = this.props.data;
      if (nextProps) {
        newData = nextProps.data;
      }
    } else if (this.props.jsonData || nextProps.jsonData) {
      let json = this.props.jsonData;
      if (nextProps) {
        json = nextProps.jsonData;
      }
      newData = this.convertJSONToTableData(json);
    }

    this.setState({tableData: newData});
  }

  convertJSONToTableData(json) {
    let data = {headers: [], data: []};
    data.headers = Object.keys(json[0]).reduce((p, c) => {
      p.push({content: capitalizeFirstLetterStr(c), sorted: 0, className: ''});
      return p;
    }, []);

    data.data = json.reduce((p, c) => {
      let row = Object.keys(c).reduce((cp, cc) => {
        cp.push({content: c[cc], link: '', newWindow: true});
        return cp;
      }, []);
      p.push(row);
      return p;
    }, []);

    return data;
  }

  render() {
    if (this.state.tableData) {
      let classes = 'rh-table rh-table-zebra' + (this.props.style ? ' rh-table-' + this.props.style : '') + (this.props.hover ? ' rh-table-hover' : '');
      return (
        <table className={classes}>
          <thead>
          <tr>
            {this.state.tableData.headers.map((th, i) => this.renderColumnHeading(th, i))}
          </tr>
          </thead>
          <tbody>
          {this.state.tableData.data.map((tr, i) => this.renderRow(tr, i))}
          </tbody>
        </table>
      );
    } else {
      return <p>No data to display.</p>
    }
  }

  renderColumnHeading(th, idx) {
    let headerClass = 'sortable ' + th.className,
        arrowClass  = 'fa fa-minus';
    if (th.sorted === -1) {
      arrowClass = 'fa fa-sort-up';
    } else if (th.sorted === 1) {
      arrowClass = 'fa fa-sort-down';
    }
    return (<th key={idx} className={headerClass}
                onClick={() => this.headerClick.call(this, idx, th.sorted)}>
      {th.content}
      <i className={arrowClass}/>
    </th>);
  }

  headerClick(idx, sorted) {
    this.sortColumn(idx, (sorted === 0 || sorted === -1 ? 1 : -1));
  }

  renderRow(tr, idx) {
    return (<tr key={idx}>
      {tr.map((td, i) => this.renderCell(td, i))}
    </tr>)
  }

  renderCell(td, idx) {
    let cellContent = td.content;
    if (td.link) {
      cellContent = (<a href={td.link}
                        target={td.newWindow ? '_blank' : ''}>{cellContent}</a>);
    }
    return <td key={idx}>{cellContent}</td>;
  }

}

DataTable.defaultProps = {
  style: '',
  hover: false
};

DataTable.propTypes = {
  data : React.PropTypes.array,
  jsonData : React.PropTypes.object,
  style: React.PropTypes.string,
  hover: React.PropTypes.bool
};

export default DataTable;