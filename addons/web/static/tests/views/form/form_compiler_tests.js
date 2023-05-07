/** @odoo-module **/
import { makeView } from "../helpers";
import { setupViewRegistries } from "@web/../tests/views/helpers";
import { FormCompiler } from "@web/views/form/form_compiler";
import { registry } from "@web/core/registry";
import { getFixture, patchWithCleanup } from "../../helpers/utils";
import { createElement } from "@web/core/utils/xml";
import { makeFakeLocalizationService } from "@web/../tests/helpers/mock_services";

function compileTemplate(arch) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(arch, "text/xml");
    const compiler = new FormCompiler({ form: xml.documentElement });
    return compiler.compile("form").outerHTML;
}

QUnit.assert.areEquivalent = function (template1, template2) {
    if (template1.replace(/\s/g, "") === template2.replace(/\s/g, "")) {
        QUnit.assert.ok(true);
    } else {
        QUnit.assert.strictEqual(template1, template2);
    }
};

QUnit.assert.areContentEquivalent = function (template, content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, "text/xml");
    const templateContent = doc.documentElement.firstChild.innerHTML;
    QUnit.assert.areEquivalent(templateContent, content);
};

QUnit.module("Form Compiler", (hooks) => {
    hooks.beforeEach(() => {
        // compiler generates a piece of template for the translate alert in multilang
        registry.category("services").add("localization", makeFakeLocalizationService());
    });
    QUnit.test("properly compile simple div", async (assert) => {
        const arch = /*xml*/ `<form><div>lol</div></form>`;
        const expected = /*xml*/ `
            <t>
                <div class="o_form_renderer o_form_nosheet" t-att-class="__comp__.props.class" t-attf-class="{{__comp__.props.record.isInEdition ? 'o_form_editable' : 'o_form_readonly'}} d-block {{ __comp__.props.record.isDirty ? 'o_form_dirty' : !__comp__.props.record.isNew ? 'o_form_saved' : '' }}" t-ref="compiled_view_root">
                    <div>lol</div>
                </div>
            </t>`;

        assert.areEquivalent(compileTemplate(arch), expected);
    });

    QUnit.test(
        "label with empty string compiles to FormLabel with empty string",
        async (assert) => {
            const arch = /*xml*/ `<form><field field_id="test" name="test"/><label for="test" string=""/></form>`;
            const expected = /*xml*/ `
            <t>
                <div class="o_form_renderer o_form_nosheet" t-att-class="__comp__.props.class" t-attf-class="{{__comp__.props.record.isInEdition ? 'o_form_editable' : 'o_form_readonly'}} d-block {{ __comp__.props.record.isDirty ? 'o_form_dirty' : !__comp__.props.record.isNew ? 'o_form_saved' : '' }}" t-ref="compiled_view_root">
                    <Field id="'test'" name="'test'" record="__comp__.props.record" fieldInfo="__comp__.props.archInfo.fieldNodes['test']" readonly="__comp__.props.archInfo.activeActions?.edit === false and !__comp__.props.record.isNew"/>
                    <FormLabel id="'test'" fieldName="'test'" record="__comp__.props.record" fieldInfo="__comp__.props.archInfo.fieldNodes['test']" className="&quot;&quot;" string="\`\`" />
                </div>
            </t>`;
            assert.areEquivalent(compileTemplate(arch), expected);
        }
    );

    QUnit.test("properly compile simple div with field", async (assert) => {
        const arch = /*xml*/ `<form><div class="someClass">lol<field field_id="display_name" name="display_name"/></div></form>`;
        const expected = /*xml*/ `
            <t>
                <div class="o_form_renderer o_form_nosheet" t-att-class="__comp__.props.class" t-attf-class="{{__comp__.props.record.isInEdition ? 'o_form_editable' : 'o_form_readonly'}} d-block {{ __comp__.props.record.isDirty ? 'o_form_dirty' : !__comp__.props.record.isNew ? 'o_form_saved' : '' }}" t-ref="compiled_view_root">
                    <div class="someClass">
                        lol
                        <Field id="'display_name'" name="'display_name'" record="__comp__.props.record" fieldInfo="__comp__.props.archInfo.fieldNodes['display_name']" readonly="__comp__.props.archInfo.activeActions?.edit === false and !__comp__.props.record.isNew"/>
                    </div>
                </div>
            </t>`;

        assert.areEquivalent(compileTemplate(arch), expected);
    });

    QUnit.test("properly compile inner groups", async (assert) => {
        const arch = /*xml*/ `
            <form>
                <group>
                    <group><field field_id="display_name" name="display_name"/></group>
                    <group><field field_id="charfield" name="charfield"/></group>
                </group>
            </form>`;
        const expected = /*xml*/ `
            <OuterGroup>
               <t t-set-slot="item_0" type="'item'" sequence="0" t-slot-scope="scope" isVisible="true" itemSpan="1">
                  <InnerGroup class="scope &amp;&amp; scope.className">
                     <t t-set-slot="item_0" type="'item'" sequence="0" t-slot-scope="scope" props="{id:'display_name',fieldName:'display_name',record:__comp__.props.record,string:__comp__.props.record.fields.display_name.string,fieldInfo:__comp__.props.archInfo.fieldNodes['display_name']}" Component="__comp__.constructor.components.FormLabel" subType="'item_component'" isVisible="true" itemSpan="2">
                        <Field id="'display_name'" name="'display_name'" record="__comp__.props.record" fieldInfo="__comp__.props.archInfo.fieldNodes['display_name']" readonly="__comp__.props.archInfo.activeActions?.edit === false and !__comp__.props.record.isNew" class="scope &amp;&amp; scope.className"/>
                     </t>
                  </InnerGroup>
               </t>
               <t t-set-slot="item_1" type="'item'" sequence="1" t-slot-scope="scope" isVisible="true" itemSpan="1">
                  <InnerGroup class="scope &amp;&amp; scope.className">
                     <t t-set-slot="item_0" type="'item'" sequence="0" t-slot-scope="scope" props="{id:'charfield',fieldName:'charfield',record:__comp__.props.record,string:__comp__.props.record.fields.charfield.string,fieldInfo:__comp__.props.archInfo.fieldNodes['charfield']}" Component="__comp__.constructor.components.FormLabel" subType="'item_component'" isVisible="true" itemSpan="2">
                        <Field id="'charfield'" name="'charfield'" record="__comp__.props.record" fieldInfo="__comp__.props.archInfo.fieldNodes['charfield']" readonly="__comp__.props.archInfo.activeActions?.edit === false and !__comp__.props.record.isNew" class="scope &amp;&amp; scope.className"/>
                     </t>
                  </InnerGroup>
               </t>
            </OuterGroup>`;

        assert.areContentEquivalent(compileTemplate(arch), expected);
    });

    QUnit.test("properly compile attributes with nested forms", async (assert) => {
        const arch = /*xml*/ `
            <form>
                <group>
                    <group>
                        <form>
                            <div>
                                <field field_id="test" name="test"/>
                            </div>
                        </form>
                    </group>
                </group>
            </form>`;
        const expected = /*xml*/ `
            <t>
                <div class="o_form_renderer o_form_nosheet" t-att-class="__comp__.props.class" t-attf-class="{{__comp__.props.record.isInEdition ? 'o_form_editable' : 'o_form_readonly'}} d-block {{ __comp__.props.record.isDirty ? 'o_form_dirty' : !__comp__.props.record.isNew ? 'o_form_saved' : '' }}" t-ref="compiled_view_root">
                    <OuterGroup>
                        <t t-set-slot="item_0" type="'item'" sequence="0" t-slot-scope="scope" isVisible="true" itemSpan="1">
                            <InnerGroup class="scope &amp;&amp; scope.className">
                                <t t-set-slot="item_0" type="'item'" sequence="0" t-slot-scope="scope" isVisible="true" itemSpan="1">
                                    <div class="o_form_renderer o_form_nosheet" t-att-class="__comp__.props.class" t-attf-class="{{__comp__.props.record.isInEdition ? 'o_form_editable' : 'o_form_readonly'}} d-block {{ __comp__.props.record.isDirty ? 'o_form_dirty' : !__comp__.props.record.isNew ? 'o_form_saved' : '' }} {{scope &amp;&amp; scope.className || &quot;&quot; }}">
                                        <div><Field id="'test'" name="'test'" record="__comp__.props.record" fieldInfo="__comp__.props.archInfo.fieldNodes['test']" readonly="__comp__.props.archInfo.activeActions?.edit === false and !__comp__.props.record.isNew"/></div>
                                    </div>
                                </t>
                            </InnerGroup>
                        </t>
                    </OuterGroup>
                </div>
            </t>
        `;

        assert.areEquivalent(compileTemplate(arch), expected);
    });

    QUnit.test("properly compile notebook", async (assert) => {
        const arch = /*xml*/ `
                <form>
                    <notebook>
                        <page name="p1" string="Page1"><field field_id="charfield" name="charfield"/></page>
                        <page name="p2" string="Page2"><field field_id="display_name" name="display_name"/></page>
                    </notebook>
                </form>`;

        const expected = /*xml*/ `
            <Notebook defaultPage="__comp__.props.record.isNew ? undefined : __comp__.props.activeNotebookPages[0]" onPageUpdate="(page) =&gt; __comp__.props.onNotebookPageChange(0, page)">
                <t t-set-slot="page_1" title="\`Page1\`" name="\`p1\`" isVisible="true">
                    <Field id="'charfield'" name="'charfield'" record="__comp__.props.record" fieldInfo="__comp__.props.archInfo.fieldNodes['charfield']" readonly="__comp__.props.archInfo.activeActions?.edit === false and !__comp__.props.record.isNew"/>
                </t>
                <t t-set-slot="page_2" title="\`Page2\`" name="\`p2\`" isVisible="true">
                    <Field id="'display_name'" name="'display_name'" record="__comp__.props.record" fieldInfo="__comp__.props.archInfo.fieldNodes['display_name']" readonly="__comp__.props.archInfo.activeActions?.edit === false and !__comp__.props.record.isNew"/>
               </t>
           </Notebook>`;

        assert.areContentEquivalent(compileTemplate(arch), expected);
    });

    QUnit.test("properly compile field without placeholder", async (assert) => {
        const arch = /*xml*/ `
            <form>
                <field field_id="display_name" name="display_name" placeholder="e.g. Contact's Name or //someinfo..."/>
            </form>`;

        const expected = /*xml*/ `
            <Field id="'display_name'" name="'display_name'" record="__comp__.props.record" fieldInfo="__comp__.props.archInfo.fieldNodes['display_name']" readonly="__comp__.props.archInfo.activeActions?.edit === false and !__comp__.props.record.isNew"/>
        `;

        assert.areContentEquivalent(compileTemplate(arch), expected);
    });

    QUnit.test("properly compile no sheet", async (assert) => {
        const arch = /*xml*/ `
            <form>
            <header>someHeader</header>
            <div>someDiv</div>
            </form>`;

        const expected = /*xml*/ `
            <t>
            <div class="o_form_renderer o_form_nosheet" t-att-class="__comp__.props.class" t-attf-class="{{__comp__.props.record.isInEdition ? 'o_form_editable' : 'o_form_readonly'}} d-block {{ __comp__.props.record.isDirty ? 'o_form_dirty' : !__comp__.props.record.isNew ? 'o_form_saved' : '' }}" t-ref="compiled_view_root">
                <div class="o_form_statusbar position-relative d-flex justify-content-between pb-3 px-3"><StatusBarButtons/></div>
                <div>someDiv</div>
            </div>
            </t>`;

        assert.areEquivalent(compileTemplate(arch), expected);
    });

    QUnit.test("properly compile sheet", async (assert) => {
        const arch = /*xml*/ `
            <form>
            <header>someHeader</header>
            <div>someDiv</div>
            <sheet>
                <div>inside sheet</div>
            </sheet>
            <div>after sheet</div>
            </form>`;

        const expected = /*xml*/ `
            <t>
            <div class="o_form_renderer" t-att-class="__comp__.props.class" t-attf-class="{{__comp__.props.record.isInEdition ? 'o_form_editable' : 'o_form_readonly'}} d-flex {{ __comp__.uiService.size &lt; 6 ? &quot;flex-column&quot; : &quot;flex-nowrap h-100&quot; }} {{ __comp__.props.record.isDirty ? 'o_form_dirty' : !__comp__.props.record.isNew ? 'o_form_saved' : '' }}" t-ref="compiled_view_root">
                <div class="o_form_sheet_bg pt-2">
                    <div class="o_form_statusbar position-relative d-flex justify-content-between pb-3 px-3"><StatusBarButtons/></div>
                    <div>someDiv</div>
                    <div class="o_form_sheet position-relative clearfix px-3">
                        <div>inside sheet</div>
                    </div>
                </div>
                <div>after sheet</div>
            </div>
            </t>
        `;

        assert.areEquivalent(compileTemplate(arch), expected);
    });

    QUnit.test("properly compile invisible", async (assert) => {
        // cf python side: def transfer_node_to_modifiers
        // modifiers' string are evaluated to their boolean or array form
        // So the following arch may actually be written as:
        // ```<form>
        //      <field name="display_name" invisible="1" />
        //      <div class="visible3" invisible="0"/>
        //      <div modifiers="{'invisible': [['display_name', '=', 'take']]}"/>
        //    </form>````
        const arch = /*xml*/ `
            <form>
                <field field_id="display_name" name="display_name" modifiers="{&quot;invisible&quot;: true}" />
                <div class="visible3" modifiers="{&quot;invisible&quot;: false}"/>
                <div modifiers="{&quot;invisible&quot;: [[&quot;display_name&quot;, &quot;=&quot;, &quot;take&quot;]]}"/>
            </form>`;

        const expected = /*xml*/ `
            <div class="visible3" />
            <div t-if="!__comp__.evalDomainFromRecord(__comp__.props.record,[[&quot;display_name&quot;,&quot;=&quot;,&quot;take&quot;]])" />
        `;

        assert.areContentEquivalent(compileTemplate(arch), expected);
    });

    QUnit.test("compile invisible containing string as domain", async (assert) => {
        const arch = /*xml*/ `
            <form>
                <field name="display_name" modifiers="{&quot;invisible&quot;: true}" />
                <div class="visible3" modifiers="{&quot;invisible&quot;: false}"/>
                <div modifiers="{&quot;invisible&quot;: &quot;[['display_name', '=', 'take']]&quot;}"/>
            </form>`;

        const expected = /*xml*/ `
            <div class="visible3" />
            <div t-if="!__comp__.evalDomainFromRecord(__comp__.props.record,&quot;[['display_name','=','take']]&quot;)" />
        `;
        assert.areContentEquivalent(compileTemplate(arch), expected);
    });

    QUnit.test("properly compile status bar with content", (assert) => {
        const arch = /*xml*/ `
            <form>
            <header><div>someDiv</div></header>
            </form>`;

        const expected = /*xml*/ `
            <div class="o_form_statusbar position-relative d-flex justify-content-between pb-3 px-3">
               <StatusBarButtons>
                  <t t-set-slot="button_0" isVisible="true">
                     <div>someDiv</div>
                  </t>
               </StatusBarButtons>
            </div>`;

        assert.areContentEquivalent(compileTemplate(arch), expected);
    });

    QUnit.test("properly compile status bar without content", (assert) => {
        const arch = /*xml*/ `
            <form>
            <header></header>
            </form>`;

        const expected = /*xml*/ `
            <div class="o_form_statusbar position-relative d-flex justify-content-between pb-3 px-3">
               <StatusBarButtons/>
            </div>`;

        assert.areContentEquivalent(compileTemplate(arch), expected);
    });

    QUnit.test("properly compile settings", (assert) => {
        const arch = /*xml*/ `
            <form>
                <setting
                         help="this is bar"
                         documentation="/applications/technical/web/settings/this_is_a_test.html"
                         company_dependent="1">
                    <field field_id="bar" name="bar"/>
                    <label>label with content</label>
                </setting>
            </form>`;

        const expected = /*xml*/ `
            <Setting title="\`\`"
                     help="\`this is bar\`"
                     companyDependent="true"
                     documentation="\`/applications/technical/web/settings/this_is_a_test.html\`"
                     record="__comp__.props.record"
                     fieldInfo="__comp__.props.archInfo.fieldNodes['bar']"
                     fieldName="\`bar\`"
                     fieldId="\`bar\`"
                     string="\`\`"
                     addLabel="true">
                <t t-set-slot="fieldSlot">
                    <Field id="'bar'"
                        name="'bar'"
                        record="__comp__.props.record"
                        fieldInfo="__comp__.props.archInfo.fieldNodes['bar']"
                        readonly="__comp__.props.archInfo.activeActions?.edit === false and !__comp__.props.record.isNew"/>
                </t>
                <label>label with content</label>
            </Setting>`;

        assert.areContentEquivalent(compileTemplate(arch), expected);
    });
});

QUnit.module("Form Renderer", (hooks) => {
    let target, serverData;

    hooks.beforeEach(() => {
        target = getFixture();
        setupViewRegistries();
        serverData = {
            models: {
                partner: {
                    fields: {
                        display_name: { type: "char" },
                        charfield: { type: "char" },
                    },
                    records: [
                        { id: 1, display_name: "firstRecord", charfield: "content of charfield" },
                    ],
                },
            },
        };
    });

    QUnit.test("compile form with modifiers and attrs - string as domain", async (assert) => {
        serverData.views = {
            "partner,1,form": /*xml*/ `
                <form>
                    <div modifiers="{&quot;invisible&quot;: &quot;[['display_name', '=', uid]]&quot;}">
                        <field name="charfield"/>
                    </div>
                    <field name="display_name" attrs="{'readonly': &quot;[['display_name', '=', uid]]&quot;}"/>
                </form>`,
        };

        await makeView({
            serverData,
            resModel: "partner",
            type: "form",
            resId: 1,
        });

        assert.containsN(target, ".o_form_editable input", 2);
    });

    QUnit.test("compile notebook with modifiers", async (assert) => {
        assert.expect(0);

        serverData.views = {
            "partner,1,form": /*xml*/ `
                <form>
                    <sheet>
                        <notebook>
                            <page name="p1" attrs="{'invisible': [['display_name', '=', 'lol']]}"><field name="charfield"/></page>
                            <page name="p2"><field name="display_name"/></page>
                        </notebook>
                    </sheet>
                </form>`,
        };

        await makeView({
            serverData,
            resModel: "partner",
            type: "form",
            resId: 1,
        });
    });

    QUnit.test("compile header and buttons", async (assert) => {
        assert.expect(0);

        serverData.views = {
            "partner,1,form": /*xml*/ `
                <form>
                    <header>
                         <button string="ActionButton" class="oe_highlight" name="action_button" type="object"/>
                     </header>
                </form>`,
        };

        await makeView({
            serverData,
            resModel: "partner",
            type: "form",
            resId: 1,
        });
    });

    QUnit.test("render field with placeholder", async (assert) => {
        assert.expect(1);

        const charField = {
            component: class CharField extends owl.Component {
                static template = owl.xml`<div/>`;
                setup() {
                    assert.strictEqual(
                        this.props.placeholder,
                        "e.g. Contact's Name or //someinfo..."
                    );
                }
            },
            extractProps: ({ attrs }) => ({ placeholder: attrs.placeholder }),
        };
        registry.category("fields").add("char", charField, { force: true });

        serverData.views = {
            "partner,1,form": /*xml*/ `
                <form>
                    <field name="display_name" placeholder="e.g. Contact's Name or //someinfo..." />
                </form>`,
        };

        await makeView({
            serverData,
            resModel: "partner",
            type: "form",
            resId: 1,
        });
    });

    QUnit.test("compile a button with id", async (assert) => {
        serverData.views = {
            "partner,1,form": /*xml*/ `
                <form>
                    <header>
                         <button id="action_button" string="ActionButton"/>
                     </header>
                </form>`,
        };

        await makeView({
            serverData,
            resModel: "partner",
            type: "form",
            resId: 1,
        });

        assert.containsOnce(target, "button[id=action_button]");
    });

    QUnit.test("invisible is correctly computed with another t-if", (assert) => {
        patchWithCleanup(FormCompiler.prototype, {
            setup() {
                this._super();
                this.compilers.push({
                    selector: "myNode",
                    fn: () => {
                        const div = createElement("div");
                        div.className = "myNode";
                        div.setAttribute("t-if", "myCondition or myOtherCondition");
                        return div;
                    },
                });
            },
        });

        const arch = `<myNode modifiers="{&quot;invisible&quot;: [[&quot;field&quot;, &quot;=&quot;, &quot;value&quot;]]}" />`;

        const expected = `<t><div class="myNode" t-if="( myCondition or myOtherCondition ) and !__comp__.evalDomainFromRecord(__comp__.props.record,[[&quot;field&quot;,&quot;=&quot;,&quot;value&quot;]])" t-ref="compiled_view_root"/></t>`;
        assert.areEquivalent(compileTemplate(arch), expected);
    });
});
