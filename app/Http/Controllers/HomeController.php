<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Libs\ReCaptcha;

class HomeController extends Controller
{
    use ReCaptcha;

    protected function username(): string
    {
        return 'name';
    }

    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request): object
    {
        if (\Auth::check()) {
            if (\Auth::user()->hasVerifiedEmail()) {
                return view('dashboard');
            } else {
                return redirect('email/verify');
            }
        } else {
            return view('home');
        }
    }

    public function help(): object
    {
        return view('help');
    }

    public function privacy_policy(): object
    {
        return view('privacy-policy');
    }

    public function contact(Request $request): object
    {
        if ($request->isMethod('get')) {
            return view('contact.index');
        }

        return view('contact.confirm')
            ->with('request', $request);
    }

    public function contact_submit(Request $request): object
    {
        if (!app()->runningUnitTests() && !$this->validateReCaptcha($request)) {
            $this->reCaptchaFailed();
        }

        \Mail::send([], [], function ($message) use ($request) {
            $message->from($request->email)
                ->to(\Config::get('mail.from.address'))
                ->subject('お問い合わせ')
                ->setBody($request->inquiry);
        });

        return redirect('/');
    }
}
