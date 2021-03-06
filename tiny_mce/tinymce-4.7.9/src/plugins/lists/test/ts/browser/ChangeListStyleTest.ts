import { GeneralSteps, Logger, Pipeline } from '@ephox/agar';
import { UnitTest } from '@ephox/bedrock';
import { TinyApis, TinyLoader, TinyUi } from '@ephox/mcagar';

import ListsPlugin from 'tinymce/plugins/lists/Plugin';
import ModernTheme from 'tinymce/themes/modern/Theme';

UnitTest.asynctest('browser.tinymce.plugins.lists.ChangeListStyleTest', function () {
  const success = arguments[arguments.length - 2];
  const failure = arguments[arguments.length - 1];

  ModernTheme();
  ListsPlugin();

  TinyLoader.setup(function (editor, onSuccess, onFailure) {
    const tinyApis = TinyApis(editor);
    const tinyUi = TinyUi(editor);

    Pipeline.async({}, [
      Logger.t('ul to ol, cursor only in parent', GeneralSteps.sequence([
        tinyApis.sSetContent('<ul><li>a</li><ul><li>b</li></ul></ul>'),
        tinyApis.sSetCursor([0, 0, 0], 0),
        tinyUi.sClickOnToolbar('click numlist button', 'div[aria-label="Numbered list"] > button'),
        tinyApis.sAssertContent('<ol><li>a</li><ul><li>b</li></ul></ol>'),
        tinyApis.sAssertSelection([0, 0, 0], 0, [0, 0, 0], 0)
      ])),
      Logger.t('ul to ol, selection from parent to sublist', GeneralSteps.sequence([
        tinyApis.sSetContent('<ul><li>a</li><ol><li>b</li></ol></ul>'),
        tinyApis.sSetSelection([0, 0, 0], 0, [0, 1, 0, 0], 1),
        tinyUi.sClickOnToolbar('click numlist button', 'div[aria-label="Numbered list"] > button'),
        tinyApis.sAssertContent('<ol><li>a</li><ol><li>b</li></ol></ol>'),
        tinyApis.sAssertSelection([0, 0, 0], 0, [0, 1, 0, 0], 1)
      ])),
      Logger.t('ol to ul, cursor only in parent', GeneralSteps.sequence([
        tinyApis.sSetContent('<ol><li>a</li><ol><li>b</li></ol></ol>'),
        tinyApis.sSetCursor([0, 0, 0], 0),
        tinyUi.sClickOnToolbar('click bullist button', 'div[aria-label="Bullet list"] > button'),
        tinyApis.sAssertContent('<ul><li>a</li><ol><li>b</li></ol></ul>'),
        tinyApis.sAssertSelection([0, 0, 0], 0, [0, 0, 0], 0)
      ])),
      Logger.t('ol to ul, selection from parent to sublist', GeneralSteps.sequence([
        tinyApis.sSetContent('<ol><li>a</li><ul><li>b</li></ul></ol>'),
        tinyApis.sSetSelection([0, 0, 0], 0, [0, 1, 0, 0], 1),
        tinyUi.sClickOnToolbar('click bullist button', 'div[aria-label="Bullet list"] > button'),
        tinyApis.sAssertContent('<ul><li>a</li><ul><li>b</li></ul></ul>'),
        tinyApis.sAssertSelection([0, 0, 0], 0, [0, 1, 0, 0], 1)
      ])),
      Logger.t('alpha to ol, cursor only in parent', GeneralSteps.sequence([
        tinyApis.sSetContent('<ul style="list-style-type: lower-alpha;"><li>a</li><ol style="list-style-type: lower-alpha;"><li>b</li></ol></ul>'),
        tinyApis.sSetCursor([0, 0, 0], 0),
        tinyUi.sClickOnToolbar('click bullist button', 'div[aria-label="Numbered list"] > button'),
        tinyApis.sAssertContent('<ol><li>a</li><ol style="list-style-type: lower-alpha;"><li>b</li></ol></ol>'),
        tinyApis.sAssertSelection([0, 0, 0], 0, [0, 0, 0], 0)
      ])),
      Logger.t('alpha to ol, selection from parent to sublist', GeneralSteps.sequence([
        tinyApis.sSetContent('<ul style="list-style-type: lower-alpha;"><li>a</li><ol style="list-style-type: lower-alpha;"><li>b</li></ol></ul>'),
        tinyApis.sSetSelection([0, 0, 0], 0, [0, 1, 0, 0], 1),
        tinyUi.sClickOnToolbar('click bullist button', 'div[aria-label="Numbered list"] > button'),
        tinyApis.sAssertContent('<ol><li>a</li><ol><li>b</li></ol></ol>'),
        tinyApis.sAssertSelection([0, 0, 0], 0, [0, 1, 0, 0], 1)
      ])),
      Logger.t('alpha to ul, cursor only in parent', GeneralSteps.sequence([
        tinyApis.sSetContent('<ol style="list-style-type: lower-alpha;"><li>a</li><ol style="list-style-type: lower-alpha;"><li>b</li></ol></ol>'),
        tinyApis.sSetCursor([0, 0, 0], 0),
        tinyUi.sClickOnToolbar('click bullist button', 'div[aria-label="Bullet list"] > button'),
        tinyApis.sAssertContent('<ul><li>a</li><ol style="list-style-type: lower-alpha;"><li>b</li></ol></ul>'),
        tinyApis.sAssertSelection([0, 0, 0], 0, [0, 0, 0], 0)
      ])),
      Logger.t('alpha to ul, selection from parent to sublist', GeneralSteps.sequence([
        tinyApis.sSetContent('<ol style="list-style-type: lower-alpha;"><li>a</li><ol style="list-style-type: lower-alpha;"><li>b</li></ol></ol>'),
        tinyApis.sSetSelection([0, 0, 0], 0, [0, 1, 0, 0], 1),
        tinyUi.sClickOnToolbar('click bullist button', 'div[aria-label="Bullet list"] > button'),
        tinyApis.sAssertContent('<ul><li>a</li><ul><li>b</li></ul></ul>'),
        tinyApis.sAssertSelection([0, 0, 0], 0, [0, 1, 0, 0], 1)
      ]))
    ], onSuccess, onFailure);
  }, {
    indent: false,
    plugins: 'lists',
    toolbar: 'numlist bullist',
    skin_url: '/project/js/tinymce/skins/lightgray'
  }, success, failure);
});
