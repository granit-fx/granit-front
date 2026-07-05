// @granit/react-ui-blog — i18next resource bundle (flat keys, "translation" ns).
// Register in the host app:
//   import { blogTranslationsEn } from "@granit/react-ui-blog";
//   i18n.addResourceBundle("en", "translation", blogTranslationsEn, true, true);
//
// Keys keep the literal `blog:` prefix (lookup runs with key/ns separators
// disabled, so these are flat string keys). This package owns the `blog:Common.*`
// keys as the Blog module root.

export const blogTranslationsEn = {
  'blog:Common.Actions': 'Actions',
  'blog:Common.Cancel': 'Cancel',
  'blog:Common.Delete': 'Delete',
  'blog:Common.Edit': 'Edit',
  'blog:Common.Loading': 'Loading…',
  'blog:Common.Remove': 'Remove',
  'blog:Common.Save': 'Save',
  'blog:Common.Saving': 'Saving…',

  'blog:Posts.Title': 'Posts',
  'blog:Posts.Subtitle': 'Author, schedule and publish blog posts.',
  'blog:Posts.NewPost': 'New post',
  'blog:Posts.LoadError': 'Failed to load posts.',
  'blog:Posts.DeleteSuccess': 'Post deleted.',
  'blog:Posts.DeleteConfirm.Title': 'Delete post?',
  'blog:Posts.DeleteConfirm.Description':
    'This will permanently delete "{{slug}}" and its content in every culture.',
  'blog:Posts.EditTitle': 'Edit post',
  'blog:Posts.CreateTitle': 'New post',
  'blog:Posts.CreateSuccess': 'Post created.',
  'blog:Posts.UpdateSuccess': 'Post updated.',
  'blog:Posts.Columns.Slug': 'Slug',
  'blog:Posts.Columns.Author': 'Author',
  'blog:Posts.Columns.Status': 'Status',
  'blog:Posts.Columns.PublishedAt': 'Published',
  'blog:Posts.Columns.Actions': 'Actions',
  'blog:Posts.Status.Draft': 'Draft',
  'blog:Posts.Status.Scheduled': 'Scheduled',
  'blog:Posts.Status.Published': 'Published',
  'blog:Posts.Fields.Slug': 'Slug',
  'blog:Posts.Fields.AuthorId': 'Author',
  'blog:Posts.Fields.AuthorPlaceholder': 'Select an author',
  'blog:Posts.Fields.CoverImage': 'Cover image',
  'blog:Posts.Fields.PickCover': 'Select cover…',

  'blog:Content.Culture': 'Culture',
  'blog:Content.Fields.Title': 'Title',
  'blog:Content.Fields.Summary': 'Summary',
  'blog:Content.CatalogError': 'Failed to load the block catalog.',
  'blog:Content.LoadingEditor': 'Loading editor…',
  'blog:Content.SaveSuccess': 'Draft saved.',

  'blog:Gallery.Title': 'Gallery',
  'blog:Gallery.Add': 'Add attachment…',
  'blog:Gallery.Empty': 'No attachments yet.',
  'blog:Gallery.Caption': 'Caption',
  'blog:Gallery.AltText': 'Alt text',
  'blog:Gallery.MoveUp': 'Move up',
  'blog:Gallery.MoveDown': 'Move down',
  'blog:Gallery.RemoveSuccess': 'Attachment removed.',
  'blog:Gallery.SaveSuccess': 'Attachment updated.',

  'blog:Lifecycle.Status': 'Status',
  'blog:Lifecycle.ScheduledFor': 'Scheduled for {{at}}',
  'blog:Lifecycle.NotScheduled': 'Not scheduled',
  'blog:Lifecycle.Publish': 'Publish now',
  'blog:Lifecycle.Unpublish': 'Unpublish',
  'blog:Lifecycle.CancelSchedule': 'Cancel schedule',
  'blog:Lifecycle.ScheduleTitle': 'Schedule publication',
  'blog:Lifecycle.LocalDateTime': 'Local date & time',
  'blog:Lifecycle.TimeZone': 'Time zone',
  'blog:Lifecycle.ScheduleAction': 'Schedule',
  'blog:Lifecycle.Published': 'Post published.',
  'blog:Lifecycle.Unpublished': 'Post unpublished.',
  'blog:Lifecycle.Scheduled': 'Post scheduled.',
  'blog:Lifecycle.ScheduleCancelled': 'Schedule cancelled.',
  'blog:Lifecycle.NoDraft': 'There is no draft to publish.',
  'blog:Lifecycle.ActionError': 'The action could not be completed.',
  'blog:Lifecycle.ScheduleIncomplete': 'Pick a date/time and a time zone.',

  'blog:Tabs.Metadata': 'Metadata',
  'blog:Tabs.Content': 'Content',
  'blog:Tabs.Media': 'Media',
  'blog:Tabs.Lifecycle': 'Lifecycle',

  'blog:Conflict.Title': 'This post changed elsewhere',
  'blog:Conflict.Slug': 'That slug is already in use. Pick another and try again.',
  'blog:Conflict.Stale':
    'This post was changed elsewhere since you loaded it. Reload to get the latest version, then re-apply your changes.',
  'blog:Conflict.Reload': 'Reload latest',

  'blog:Authors.Title': 'Authors',
  'blog:Authors.Subtitle': 'Manage author profiles for this site.',
  'blog:Authors.NewAuthor': 'New author',
  'blog:Authors.LoadError': 'Failed to load authors.',
  'blog:Authors.DeleteSuccess': 'Author deleted.',
  'blog:Authors.DeleteConfirm.Title': 'Delete author?',
  'blog:Authors.DeleteConfirm.Description': 'This will delete the profile for "{{name}}".',
  'blog:Authors.Columns.DisplayName': 'Display name',
  'blog:Authors.Columns.UserId': 'User',
  'blog:Authors.Empty': 'No authors yet.',
  'blog:Authors.EditTitle': 'Edit author',
  'blog:Authors.CreateTitle': 'New author',
  'blog:Authors.CreateSuccess': 'Author created.',
  'blog:Authors.UpdateSuccess': 'Author updated.',
  'blog:Authors.Fields.UserId': 'User',
  'blog:Authors.Fields.DisplayName': 'Display name',
  'blog:Authors.Fields.Bio': 'Bio',
  'blog:Authors.Fields.Avatar': 'Avatar',
  'blog:Authors.Fields.PickAvatar': 'Select avatar…',
} as const;

export type BlogTranslations = typeof blogTranslationsEn;
