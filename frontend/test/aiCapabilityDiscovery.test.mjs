import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const agentsSource = read('../AGENTS.md');
const deliveryFlowSource = read('../docs/ai-delivery-flow.md');
const developmentRulesSource = read('../docs/ai-development-rules.md');

test('AI 判断底座缺少能力前必须完成多入口检索', () => {
  assert.match(agentsSource, /判断底座没有某项能力[\s\S]*组件入口[\s\S]*组件工作台[\s\S]*实际行为/);
  assert.match(deliveryFlowSource, /能力检索[\s\S]*用户说法[\s\S]*组件入口[\s\S]*工作台示例[\s\S]*实际行为/);
  assert.match(deliveryFlowSource, /不得只按[“"]?单一关键词/);
});

test('用户口中的分类导航明确区分同页定位和页面切换', () => {
  assert.match(developmentRulesSource, /详情页 Tab/);
  assert.match(developmentRulesSource, /顶部页签/);
  assert.match(developmentRulesSource, /TemplateDetailPage\.sectionNavigation/);
  assert.match(developmentRulesSource, /sectionKey/);
  assert.match(developmentRulesSource, /点击[\s\S]*定位[\s\S]*不是[\s\S]*切换或隐藏内容/);
  assert.match(developmentRulesSource, /DetailTemplateDemo\.tsx/);
  assert.match(developmentRulesSource, /页面切换 Tab/);
  assert.match(developmentRulesSource, /ViewTabs/);
  assert.match(developmentRulesSource, /onChange[\s\S]*navigate/);
  assert.match(developmentRulesSource, /切换到不同页面或路由/);
  assert.match(developmentRulesSource, /BaseSection\.tsx/);
  assert.match(developmentRulesSource, /同一页面内定位[\s\S]*切换页面或路由/);
});
