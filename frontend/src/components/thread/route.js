import React from 'react';
import Participants from 'misago/components/participants'; // jshint ignore:line
import { Poll } from 'misago/components/poll'; // jshint ignore:line
import PostsList from 'misago/components/posts-list'; // jshint ignore:line
import Header from './header'; // jshint ignore:line
import ToolbarTop from './toolbar-top'; // jshint ignore:line
import ToolbarBottom from './toolbar-bottom'; // jshint ignore:line
import * as participants from 'misago/reducers/participants'; // jshint ignore:line
import * as poll from 'misago/reducers/poll'; // jshint ignore:line
import * as posts from 'misago/reducers/posts';
import * as thread from 'misago/reducers/thread'; // jshint ignore:line
import ajax from 'misago/services/ajax';
import polls from 'misago/services/polls';
import snackbar from 'misago/services/snackbar';
import posting from 'misago/services/posting'; // jshint ignore:line
import store from 'misago/services/store';
import title from 'misago/services/page-title';

export default class extends React.Component {
  componentDidMount() {
    if (this.shouldFetchData()) {
      this.fetchData();
      this.setPageTitle();
    }

    this.startPollingApi();
  }

  componentDidUpdate() {
    if (this.shouldFetchData()) {
      this.fetchData();
      this.startPollingApi();
      this.setPageTitle();
    }
  }

  componentWillUnmount() {
    this.stopPollingApi();
  }

  shouldFetchData() {
    if (this.props.posts.isLoaded) {
      const page = (this.props.params.page || 1) * 1;
      return page != this.props.posts.page;
    } else {
      return false;
    }
  }

  fetchData() {
    store.dispatch(posts.unload());

    ajax.get(this.props.thread.api.posts.index, {
      page: this.props.params.page || 1
    }, 'posts').then((data) => {
      this.update(data);
    }, (rejection) => {
      snackbar.apiError(rejection);
    });
  }

  startPollingApi() {
    polls.start({
      poll: 'thread-posts',

      url: this.props.thread.api.posts.index,
      data: {
        page: this.props.params.page || 1
      },
      update: this.update,

      frequency: 120 * 1000,
      delayed: true
    });
  }

  stopPollingApi() {
    polls.stop('thread-posts');
  }

  setPageTitle() {
    title.set({
      title: this.props.thread.title,
      parent: this.props.thread.category.name,
      page: (this.props.params.page || 1) * 1
    });
  }

  /* jshint ignore:start */
  update = (data) => {
    store.dispatch(thread.replace(data));
    store.dispatch(posts.load(data.post_set));

    if (data.participants) {
      store.dispatch(participants.replace(data.participants));
    }

    if (data.poll) {
      store.dispatch(poll.replace(data.poll));
    }

    this.setPageTitle();
  };

  openReplyForm = () => {
    posting.open({
      mode: 'REPLY',

      config: this.props.thread.api.editor,
      submit: this.props.thread.api.posts.index
    });
  };
  /* jshint ignore:end */

  render() {
    /* jshint ignore:start */
    let className = 'page page-thread';
    if (this.props.thread.category.css_class) {
      className += ' page-thread-' + this.props.thread.category.css_class;
    }

    return <div className={className}>
      <div className="page-header-bg">
        <Header {...this.props} />
      </div>
      <div className="container">

        <ToolbarTop
          openReplyForm={this.openReplyForm}
          {...this.props}
        />
        <Poll
          poll={this.props.poll}
          thread={this.props.thread}
          user={this.props.user}
        />
        <Participants
          participants={this.props.participants}
          thread={this.props.thread}
          user={this.props.user}
        />
        <PostsList {...this.props} />
        <ToolbarBottom
          openReplyForm={this.openReplyForm}
          {...this.props}
        />

      </div>
    </div>;
    /* jshint ignore:end */
  }
}