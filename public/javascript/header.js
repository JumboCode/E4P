/*eslint-disable-next-line*/
import {jsxElem} from './jsxElem';
import $ from 'jquery';

export function generateAdminHeader() {
  generateHeader('admin');
}

export function generateUserHeader() {
  generateHeader('user');
}

function generateHeader(role) {
  let href = role === 'user' ? '/' : '/admin';
  let login = '/admin/login';
  let logout = '/admin/logout';
  let buttons = role === 'user' ?
    [
      <a href='/help' target='_blank'>Help</a>,
      <a href='http://sites.tufts.edu/ears4peers/contact-us/' target='_blank'>Feedback</a>,
      <a href={login}>Login</a>
    ] : <a href={logout}>Logout</a>;
  $('.topnav').first().html([
    <a class='active' href={href}>E4P</a>,
    <div class='topnav-right'>
      {buttons}
    </div>
  ]);
}
